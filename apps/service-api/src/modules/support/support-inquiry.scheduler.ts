import { QueryOrder, RequestContext as MikroRequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { isWithinOperatingHours, TimeUtil, uuid } from '@pkg/shared/common';

import { SERVICE_RUNTIME_CONFIG } from '#/app.config';
import { SupportMessage, SupportMessageSenderType } from '#/entities/support/support-message.entity';
import { SupportRoom, SupportRoomStatus } from '#/entities/support/support-room.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { KvStore } from '#/infra/kv-store/kv-store.service';
import { SystemContext } from '#/modules/system-configs/system.context';

import { InquiryAlertService } from './inquiry-alert.service';
import { SupportService } from './support.service';

const UNANSWERED_JOB_LOCK = 'service:support:scheduler:unanswered';
const AUTO_CLOSE_JOB_LOCK = 'service:support:scheduler:auto-close';

@Injectable()
export class SupportInquiryScheduler {
  private readonly logger = new Logger(SupportInquiryScheduler.name);

  constructor(
    private readonly em: AppEntityManager,
    private readonly kvStore: KvStore,
    private readonly systemContext: SystemContext,
    private readonly alertService: InquiryAlertService,
    private readonly supportService: SupportService,
  ) {}

  @Interval(TimeUtil.ms.minute(SERVICE_RUNTIME_CONFIG.support.unansweredCheckIntervalMinutes))
  async checkUnansweredRooms(): Promise<void> {
    const lockToken = uuid();
    try {
      if (!await this.kvStore.setIfAbsent(
        UNANSWERED_JOB_LOCK,
        lockToken,
        TimeUtil.s.minute(SERVICE_RUNTIME_CONFIG.support.unansweredCheckIntervalMinutes * 4),
      )) return;
      try {
        await MikroRequestContext.create(this.em, async () => {
          const config = await this.systemContext.getConfig();
          const { webhook } = config;
          if (!webhook.enabled || !webhook.webhookUrl.trim()) return;
          if (!isWithinOperatingHours(config.operation, new Date())) return;

          const threshold = new Date(Date.now() - config.inquiry.unansweredThresholdMinutes * TimeUtil.ms.minute(1));
          const rooms = await this.em.find(SupportRoom, {
            status: { $in: [SupportRoomStatus.OPEN, SupportRoomStatus.IN_PROGRESS] },
            lastMessageAt: { $lte: threshold },
          });

          for (const room of rooms) {
            const lastHumanMessage = await this.em.findOne(
              SupportMessage,
              { room: room.id, senderType: { $in: [SupportMessageSenderType.USER, SupportMessageSenderType.AGENT] } },
              { orderBy: { createdAt: QueryOrder.DESC } },
            );
            if (!lastHumanMessage || lastHumanMessage.senderType !== SupportMessageSenderType.USER || lastHumanMessage.createdAt > threshold) continue;

            const cooldownKey = `service:support:unanswered-alert:${room.id}`;
            const acquired = await this.kvStore.setIfAbsent(
              cooldownKey,
              '1',
              TimeUtil.s.minute(webhook.cooldownMinutes),
            );
            if (!acquired) continue;

            const elapsedMinutes = Math.floor((Date.now() - lastHumanMessage.createdAt.getTime()) / TimeUtil.ms.minute(1));
            try {
              const sent = await this.alertService.sendUnansweredAlert(room.id, elapsedMinutes);
              if (!sent) await this.kvStore.del(cooldownKey);
            }
            catch (error) {
              await this.kvStore.del(cooldownKey);
              throw error;
            }
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

  @Interval(TimeUtil.ms.minute(SERVICE_RUNTIME_CONFIG.support.autoCloseCheckIntervalMinutes))
  async autoCloseAnsweredRooms(): Promise<void> {
    try {
      const lockTtlMinutes = Math.max(1, SERVICE_RUNTIME_CONFIG.support.autoCloseCheckIntervalMinutes - 1);
      if (!await this.kvStore.setIfAbsent(AUTO_CLOSE_JOB_LOCK, '1', TimeUtil.s.minute(lockTtlMinutes))) return;
      await MikroRequestContext.create(this.em, async () => {
        const { autoCloseHours } = (await this.systemContext.getConfig()).inquiry;
        const threshold = new Date(Date.now() - autoCloseHours * TimeUtil.ms.hour(1));
        const rooms = await this.em.find(SupportRoom, {
          status: SupportRoomStatus.IN_PROGRESS,
          lastMessageAt: { $lte: threshold },
        });
        const closedRoomIds: string[] = [];

        for (const room of rooms) {
          const lastMessage = await this.em.findOne(
            SupportMessage,
            { room: room.id },
            { orderBy: { createdAt: QueryOrder.DESC } },
          );
          if (!lastMessage || lastMessage.senderType !== SupportMessageSenderType.AGENT || lastMessage.createdAt > threshold) continue;
          room.status = SupportRoomStatus.CLOSED;
          closedRoomIds.push(room.id);
        }

        if (closedRoomIds.length === 0) return;
        await this.em.flush();
        for (const roomId of closedRoomIds) this.supportService.broadcastRoomStatusChanged(roomId, SupportRoomStatus.CLOSED);
        this.logger.log(`자동 종료된 고객지원 상담: ${closedRoomIds.length}건`);
      });
    }
    catch (error) {
      this.logger.error(`고객지원 자동 종료 작업에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
