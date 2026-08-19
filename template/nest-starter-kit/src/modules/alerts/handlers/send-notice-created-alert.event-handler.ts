import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/database/entity-manager';
import { Alert, AlertType } from '#/entities/alerts/alert.entity';
import { User } from '#/entities/auth/user.entity';
import { AlertsGateway } from '#/modules/alerts/alerts.gateway';
import { AlertItemDto } from '#/modules/alerts/dto/alert-item.dto';
import { NoticeCreatedEvent } from '#/modules/notices/events';

@Injectable()
@EventsHandler(NoticeCreatedEvent)
export class SendNoticeCreatedAlertEventHandler implements IEventHandler<NoticeCreatedEvent> {
  private readonly logger = new Logger(SendNoticeCreatedAlertEventHandler.name);

  constructor(
    private readonly em: AppEntityManager,
    private readonly alertsGateway: AlertsGateway,
  ) {}

  async handle(event: NoticeCreatedEvent): Promise<void> {
    const { notice } = event;
    if (!notice.isPublished) return;

    try {
      const activeUsers = await this.em.find(User, { isBanned: false, deletedAt: null });
      if (activeUsers.length === 0) return;

      const title = '📢 새 공지사항';
      const content = notice.title;
      const linkUrl = '/notice';

      for (const user of activeUsers) {
        const alert = this.em.create(Alert, {
          user,
          type: AlertType.NOTICE,
          title,
          content,
          linkUrl,
          isRead: false,
        });
        this.em.persist(alert);
      }

      // 소켓에 브로드캐스트 전송
      await this.alertsGateway.broadcastAlert(
        new AlertItemDto(
          this.em.create(Alert, {
            user: activeUsers[0],
            type: AlertType.NOTICE,
            title,
            content,
            linkUrl,
            isRead: false,
          }),
        ),
      );
    }
    catch (err) {
      this.logger.warn(`Failed to create notice alerts: ${String(err)}`);
    }
  }
}
