import { RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { Alert, AlertType } from '#/entities/alerts/alert.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { TemplateRendererService } from '#/infra/notification';
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
    private readonly templateRenderer: TemplateRendererService,
  ) {}

  async handle(event: NoticeCreatedEvent): Promise<void> {
    const { notice } = event;
    const now = new Date();
    const publishedAt = notice.publishedAt ? new Date(notice.publishedAt) : null;
    const expiresAt = notice.expiresAt ? new Date(notice.expiresAt) : null;
    if (!publishedAt || publishedAt > now || (expiresAt !== null && expiresAt <= now)) return;

    try {
      await RequestContext.create(this.em, async () => {
        const activeUsers = await this.em.find(User, {
          deletedAt: null,
          $or: [
            { banExpires: null },
            { banExpires: { $lte: now } },
          ],
        });
        if (activeUsers.length === 0) return;

        const rendered = await this.templateRenderer.render(
          'NOTICE_CREATED',
          {
            title: notice.title,
            id: notice.id,
            linkUrl: `/notice?noticeId=${notice.id}`,
          },
          {
            fallback: {
              title: '📢 새 공지사항',
              body: notice.title,
            },
          },
        );

        const title = rendered.title || '📢 새 공지사항';
        const content = rendered.body;
        const linkUrl = `/notice?noticeId=${notice.id}`;

        const alerts = activeUsers.map((user) => ({
          user,
          alert: this.em.create(Alert, {
            user,
            type: AlertType.NOTICE,
            title,
            content,
            linkUrl,
            isRead: false,
          }),
        }));

        for (const { alert } of alerts) {
          this.em.persist(alert);
        }

        await this.em.flush();

        await Promise.all(
          alerts.map(({ user, alert }) => this.alertsGateway.sendAlertToUser(user.id, new AlertItemDto(alert))),
        );
      });
    }
    catch (err) {
      this.logger.warn(`Failed to create notice alerts: ${String(err)}`);
    }
  }
}
