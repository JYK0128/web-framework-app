import { QueryOrder, RequestContext as MikroRequestContext } from '@mikro-orm/core';
import { Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { KvStore } from '@pkg/server-core/kv-store/kv-store.service';
import { RealtimeService } from '@pkg/server-core/realtime/realtime.service';
import { TimeUtil } from '@pkg/shared/common';

import { SERVICE_RUNTIME_CONFIG } from '#/app.config';
import { SupportMessage, SupportMessageSenderType, SupportRoom, SupportRoomStatus } from '#/core/database/entities/support';
import { AppEntityManager } from '#/core/database/entity-manager';
import { AutoCloseSupportRoomsCommand } from '#/modules/support/notification/auto-close-support-rooms.command';
import { ServiceContext } from '#/modules/system-configs/service.context';

const AUTO_CLOSE_JOB_LOCK = 'service:support:scheduler:auto-close';

@CommandHandler(AutoCloseSupportRoomsCommand)
export class AutoCloseSupportRoomsHandler implements ICommandHandler<AutoCloseSupportRoomsCommand, void> {
  constructor(private readonly em: AppEntityManager, private readonly kvStore: KvStore, private readonly serviceContext: ServiceContext, private readonly realtime: RealtimeService) {}
  async execute(_command: AutoCloseSupportRoomsCommand): Promise<void> {
    try {
      const lockTtlMinutes = Math.max(1, SERVICE_RUNTIME_CONFIG.support.autoCloseCheckIntervalMinutes - 1);
      if (!await this.kvStore.setIfAbsent(AUTO_CLOSE_JOB_LOCK, '1', TimeUtil.s.minute(lockTtlMinutes))) return;
      await MikroRequestContext.create(this.em, async () => {
        const { autoCloseHours } = (await this.serviceContext.getConfig()).inquiry;
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
        for (const roomId of closedRoomIds) await this.realtime.emitSocket({ namespace: '/support', room: roomId }, 'support.room.status.changed', { roomId });
        this.logger.log(`자동 종료된 고객지원 상담: ${closedRoomIds.length}건`);
      });
    }
    catch (error) {
      this.logger.error(`고객지원 자동 종료 작업에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private readonly logger = new Logger(AutoCloseSupportRoomsHandler.name);
}
