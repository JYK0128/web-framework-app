import { QueryOrder, RequestContext as MikroRequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TimeUtil } from '@pkg/shared/common';

import { SupportMessage, SupportMessageSenderType } from '#/entities/support/support-message.entity';
import { SupportRoom, SupportRoomStatus } from '#/entities/support/support-room.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { KvStore } from '#/infra/kv-store/kv-store.service';
import { MaintenanceService } from '#/modules/system-configs/maintenance.service';

import { SupportService } from './support.service';
import { SupportAlertService } from './support-alert.service';
import { SupportRuntimeConfigService } from './support-runtime-config.service';

const UNANSWERED_JOB_LOCK = 'service:support:scheduler:unanswered';
const AUTO_CLOSE_JOB_LOCK = 'service:support:scheduler:auto-close';

@Injectable()
export class SupportInquiryScheduler {
  private readonly logger = new Logger(SupportInquiryScheduler.name);

  constructor(
    private readonly em: AppEntityManager,
    private readonly kvStore: KvStore,
    private readonly runtimeConfig: SupportRuntimeConfigService,
    private readonly maintenanceService: MaintenanceService,
    private readonly alertService: SupportAlertService,
    private readonly supportService: SupportService,
  ) {}

  @Cron('*/5 * * * *')
  async checkUnansweredRooms(): Promise<void> {
    try {
      if (!await this.kvStore.setIfAbsent(UNANSWERED_JOB_LOCK, '1', TimeUtil.s.minute(4))) return;
      await MikroRequestContext.create(this.em, async () => {
        const config = await this.runtimeConfig.getConfig();
        if (!config.inquiry.notification.enabled || !config.inquiry.notification.webhookUrl.trim()) return;
        if (!this.runtimeConfig.isOperatingAt(config, new Date())) return;
        if ((await this.maintenanceService.getStatus()).active) return;

        const threshold = new Date(Date.now() - config.inquiry.unansweredThresholdMinutes * TimeUtil.ms.minute(1));
        const rooms = await this.em.find(SupportRoom, {
          status: { $in: [SupportRoomStatus.OPEN, SupportRoomStatus.IN_PROGRESS] },
          lastMessageAt: { $lte: threshold },
        });

        for (const room of rooms) {
          const lastMessage = await this.em.findOne(
            SupportMessage,
            { room: room.id },
            { orderBy: { createdAt: QueryOrder.DESC } },
          );
          if (!lastMessage || lastMessage.senderType !== SupportMessageSenderType.USER || lastMessage.createdAt > threshold) continue;

          const cooldownKey = `service:support:unanswered-alert:${room.id}`;
          const acquired = await this.kvStore.setIfAbsent(
            cooldownKey,
            '1',
            TimeUtil.s.minute(config.inquiry.notification.cooldownMinutes),
          );
          if (!acquired) continue;

          const elapsedMinutes = Math.floor((Date.now() - lastMessage.createdAt.getTime()) / TimeUtil.ms.minute(1));
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
    catch (error) {
      this.logger.error(`미응답 고객지원 알림 작업에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  @Cron('*/10 * * * *')
  async autoCloseAnsweredRooms(): Promise<void> {
    try {
      if (!await this.kvStore.setIfAbsent(AUTO_CLOSE_JOB_LOCK, '1', TimeUtil.s.minute(9))) return;
      await MikroRequestContext.create(this.em, async () => {
        const config = await this.runtimeConfig.getConfig();
        const threshold = new Date(Date.now() - config.inquiry.autoCloseHours * TimeUtil.ms.hour(1));
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
