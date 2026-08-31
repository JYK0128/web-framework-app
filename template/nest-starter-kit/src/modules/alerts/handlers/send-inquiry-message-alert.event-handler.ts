import { RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { Alert, AlertType } from '#/entities/alerts/alert.entity';
import { User } from '#/entities/auth/user.entity';
import { InquiryMessageAuthorRole } from '#/entities/inquiries/inquiry-message.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { TemplateRendererService } from '#/infra/notification';
import { AlertsGateway } from '#/modules/alerts/alerts.gateway';
import { AlertItemDto } from '#/modules/alerts/dto/alert-item.dto';
import { InquiryMessageCreatedEvent } from '#/modules/inquiries/events';

@Injectable()
@EventsHandler(InquiryMessageCreatedEvent)
export class SendInquiryMessageAlertEventHandler implements IEventHandler<InquiryMessageCreatedEvent> {
  private readonly logger = new Logger(SendInquiryMessageAlertEventHandler.name);

  constructor(
    private readonly em: AppEntityManager,
    private readonly alertsGateway: AlertsGateway,
    private readonly templateRenderer: TemplateRendererService,
  ) {}

  async handle(event: InquiryMessageCreatedEvent): Promise<void> {
    const { inquiry, message } = event;

    try {
      await RequestContext.create(this.em, async () => {
        if (message.authorRole === InquiryMessageAuthorRole.ADMIN) {
          await this.handleAdminMessage(inquiry);
        }
        else if (message.authorRole === InquiryMessageAuthorRole.USER) {
          await this.handleUserMessage(inquiry);
        }
      });
    }
    catch (err) {
      this.logger.warn(`Failed to process inquiry message alert: ${String(err)}`);
    }
  }

  private async handleAdminMessage(inquiry: InquiryMessageCreatedEvent['inquiry']): Promise<void> {
    const customerId = typeof inquiry.user === 'object' && inquiry.user ? inquiry.user.id : String(inquiry.user);
    if (!customerId) return;

    const user = await this.em.findOne(User, {
      id: customerId,
      deletedAt: null,
      $or: [{ banExpires: null }, { banExpires: { $lte: new Date() } }],
    });
    if (!user) return;

    const rendered = await this.templateRenderer.render(
      'INQUIRY_REPLY',
      {
        title: inquiry.title,
        inquiryId: inquiry.id,
        linkUrl: `/inquiry?inquiryId=${inquiry.id}`,
      },
      {
        fallback: {
          title: '1:1 문의 답변 등록',
          body: `'${inquiry.title}' 문의에 운영자의 답변이 등록되었습니다.`,
        },
      },
    );

    const alert = this.em.create(Alert, {
      user,
      type: AlertType.INQUIRY_REPLY,
      title: rendered.title || '1:1 문의 답변 등록',
      content: rendered.body,
      linkUrl: `/inquiry?inquiryId=${inquiry.id}`,
      isRead: false,
    });
    this.em.persist(alert);
    await this.em.flush();

    await this.alertsGateway.broadcastAlert(new AlertItemDto(alert));
  }

  private async handleUserMessage(inquiry: InquiryMessageCreatedEvent['inquiry']): Promise<void> {
    if (!inquiry.assignee) return;
    const assigneeId = typeof inquiry.assignee === 'object' && inquiry.assignee ? inquiry.assignee.id : String(inquiry.assignee);
    if (!assigneeId) return;

    const assignee = await this.em.findOne(User, {
      id: assigneeId,
      deletedAt: null,
      $or: [{ banExpires: null }, { banExpires: { $lte: new Date() } }],
    });
    if (!assignee) return;

    const rendered = await this.templateRenderer.render(
      'INQUIRY_MESSAGE',
      {
        title: inquiry.title,
        inquiryId: inquiry.id,
        linkUrl: `/inquiry-management?inquiryId=${inquiry.id}`,
      },
      {
        fallback: {
          title: '1:1 문의 새 메시지',
          body: `'${inquiry.title}' 문의에 새로운 고객 메시지가 도착했습니다.`,
        },
      },
    );

    const alert = this.em.create(Alert, {
      user: assignee,
      type: AlertType.INQUIRY_MESSAGE,
      title: rendered.title || '1:1 문의 새 메시지',
      content: rendered.body,
      linkUrl: `/inquiry-management?inquiryId=${inquiry.id}`,
      isRead: false,
    });
    this.em.persist(alert);
    await this.em.flush();

    await this.alertsGateway.broadcastAlert(new AlertItemDto(alert));
  }
}
