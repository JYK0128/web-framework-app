import { QueryOrder, RequestContext as MikroRequestContext } from '@mikro-orm/core';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { EVENT_BROKER } from '@pkg/server-core/event-broker/event-broker.interface';
import { EventBroker } from '@pkg/server-core/event-broker/event-broker.service';
import { KvStore } from '@pkg/server-core/kv-store/kv-store.service';
import { TimeUtil, uuid } from '@pkg/shared/common';
import { isWithinOperatingHours } from '@pkg/shared/policy';
import { SupportUnansweredAlertEvent } from '@pkg/shared/server';

import { SERVICE_RUNTIME_CONFIG } from '#/app.config';
import { SupportMessage, SupportMessageSenderType, SupportRoom, SupportRoomStatus } from '#/core/database/entities/support';
import { AppEntityManager } from '#/core/database/entity-manager';
import { CheckUnansweredSupportRoomsCommand } from '#/modules/support/notification/check-unanswered-support-rooms.command';
import { InquiryWebhookService } from '#/modules/support/notification/inquiry-webhook.service';
import { ServiceContext } from '#/modules/system-configs/service.context';
import { SystemContext, type WebhookConfig } from '#/modules/system-configs/system.context';

const UNANSWERED_JOB_LOCK = 'service:support:scheduler:unanswered';

@CommandHandler(CheckUnansweredSupportRoomsCommand)
export class CheckUnansweredSupportRoomsHandler implements ICommandHandler<CheckUnansweredSupportRoomsCommand, void> {
  constructor(private readonly em: AppEntityManager, private readonly kvStore: KvStore, private readonly serviceContext: ServiceContext, private readonly systemContext: SystemContext, private readonly inquiryWebhooks: InquiryWebhookService, @Inject(EVENT_BROKER.REDIS_PUBSUB) private readonly eventBroker: EventBroker) {}
  async execute(_command: CheckUnansweredSupportRoomsCommand): Promise<void> {
    const lockToken = uuid();
    try {
      if (!await this.kvStore.setIfAbsent(
        UNANSWERED_JOB_LOCK,
        lockToken,
        TimeUtil.s.minute(SERVICE_RUNTIME_CONFIG.support.unansweredCheckIntervalMinutes * 4),
      )) return;
      try {
        await MikroRequestContext.create(this.em, async () => {
          const [serviceConfig, systemConfig] = await Promise.all([this.serviceContext.getConfig(), this.systemContext.getConfig()]);
          const { webhook } = systemConfig;
          if (!isWithinOperatingHours(serviceConfig.operation, new Date())) return;

          const threshold = new Date(Date.now() - serviceConfig.inquiry.unansweredThresholdMinutes * TimeUtil.ms.minute(1));
          const rooms = await this.em.find(SupportRoom, {
            status: { $in: [SupportRoomStatus.OPEN, SupportRoomStatus.IN_PROGRESS] },
            lastMessageAt: { $lte: threshold },
          });

          for (const room of rooms) {
            await this.processUnansweredRoom(room, threshold, webhook);
          }
        });
      }
      finally {
        await this.kvStore.delIfValue(UNANSWERED_JOB_LOCK, lockToken);
      }
    }
    catch (error) {
      this.logger.error(`미응답 고객지원 알림 작업에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private readonly logger = new Logger(CheckUnansweredSupportRoomsHandler.name);
  private async processUnansweredRoom(room: SupportRoom, threshold: Date, webhook: WebhookConfig): Promise<void> {
    const lastHumanMessage = await this.em.findOne(
      SupportMessage,
      { room: room.id, senderType: { $in: [SupportMessageSenderType.USER, SupportMessageSenderType.AGENT] } },
      { orderBy: { createdAt: QueryOrder.DESC } },
    );
    if (!lastHumanMessage || lastHumanMessage.senderType !== SupportMessageSenderType.USER || lastHumanMessage.createdAt > threshold) return;

    const cooldownKey = `service:support:unanswered-alert:${room.id}`;
    const acquired = await this.kvStore.setIfAbsent(cooldownKey, '1', TimeUtil.s.minute(webhook.cooldownMinutes));
    if (!acquired) return;

    const elapsedMinutes = Math.floor((Date.now() - lastHumanMessage.createdAt.getTime()) / TimeUtil.ms.minute(1));
    try {
      await this.eventBroker.publish(
        new SupportUnansweredAlertEvent(room.id, elapsedMinutes, new Date().toISOString()),
      );
      if (webhook.enabled && webhook.webhookUrl.trim()) {
        await this.inquiryWebhooks.sendUnansweredWebhook(room.id, elapsedMinutes);
      }
    }
    catch (error) {
      try {
        await this.kvStore.del(cooldownKey);
      }
      catch (cleanupError) {
        this.logger.error(
          `미응답 알림 쿨다운 해제에 실패했습니다. 상담 ID: ${room.id}, 오류: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
        );
      }
      this.logger.error(
        `미응답 고객지원 알림 발송에 실패했습니다. 상담 ID: ${room.id}, 오류: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
