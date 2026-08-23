import { RequestContext } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { ALERT_MESSAGES } from '#/common/constants/alert.constants';
import { Alert, AlertType } from '#/entities/alerts/alert.entity';
import { User } from '#/entities/auth/user.entity';
import { InquiryMessageAuthorRole } from '#/entities/inquiries/inquiry-message.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
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

    const user = await this.em.findOne(User, { id: customerId, isBanned: false, deletedAt: null });
    if (!user) return;

    const alert = this.em.create(Alert, {
      user,
      type: AlertType.INQUIRY_REPLY,
      title: ALERT_MESSAGES.INQUIRY_REPLY_TITLE,
      content: ALERT_MESSAGES.INQUIRY_REPLY_CONTENT(inquiry.title),
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

    const assignee = await this.em.findOne(User, { id: assigneeId, isBanned: false, deletedAt: null });
    if (!assignee) return;

    const alert = this.em.create(Alert, {
      user: assignee,
      type: AlertType.INQUIRY_MESSAGE,
      title: ALERT_MESSAGES.INQUIRY_MESSAGE_TITLE,
      content: ALERT_MESSAGES.INQUIRY_MESSAGE_CONTENT(inquiry.title),
      linkUrl: `/inquiry-management?inquiryId=${inquiry.id}`,
      isRead: false,
    });
    this.em.persist(alert);
    await this.em.flush();

    await this.alertsGateway.broadcastAlert(new AlertItemDto(alert));
  }
}
