import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { ALERT_MESSAGES } from '#/common/constants/alert.constants';
import { AlertType } from '#/entities/alerts/alert.entity';
import { InquiryMessageAuthorRole } from '#/entities/inquiries/inquiry-message.entity';
import { CreateAlertCommand } from '#/modules/alerts/commands/create-alert.command';
import { InquiryMessageCreatedEvent } from '#/modules/inquiries/events';
import { InquiryMessagesGateway } from '#/modules/inquiries/inquiry-messages.gateway';

@Injectable()
@EventsHandler(InquiryMessageCreatedEvent)
export class SendInquiryMessageAlertEventHandler implements IEventHandler<InquiryMessageCreatedEvent> {
  private readonly logger = new Logger(SendInquiryMessageAlertEventHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly inquiryGateway: InquiryMessagesGateway,
  ) {}

  async handle(event: InquiryMessageCreatedEvent): Promise<void> {
    const { inquiry, message } = event;

    try {
      if (message.authorRole === InquiryMessageAuthorRole.ADMIN) {
        await this.handleAdminMessage(inquiry);
      }
      else if (message.authorRole === InquiryMessageAuthorRole.USER) {
        await this.handleUserMessage(inquiry);
      }
    }
    catch (err) {
      this.logger.warn(`Failed to process inquiry message alert: ${String(err)}`);
    }
  }

  private async handleAdminMessage(inquiry: InquiryMessageCreatedEvent['inquiry']): Promise<void> {
    const customerId = typeof inquiry.user === 'object' && inquiry.user ? inquiry.user.id : String(inquiry.user);
    if (!customerId) return;

    // 고객이 현재 해당 대화방에 접속 중인지 확인 (대화 중이면 인앱 알림 생략)
    if (await this.inquiryGateway.isUserInInquiryRoom(customerId, inquiry.id)) {
      this.logger.debug(`User ${customerId} is active in inquiry room ${inquiry.id}. Skipping Alert creation.`);
      return;
    }

    await this.commandBus.execute(
      new CreateAlertCommand({
        userId: customerId,
        type: AlertType.INQUIRY_REPLY,
        title: ALERT_MESSAGES.INQUIRY_REPLY_TITLE,
        content: ALERT_MESSAGES.INQUIRY_REPLY_CONTENT(inquiry.title),
        linkUrl: `/inquiries?inquiryId=${inquiry.id}`,
      }),
    );
  }

  private async handleUserMessage(inquiry: InquiryMessageCreatedEvent['inquiry']): Promise<void> {
    if (!inquiry.assignee) return;
    const assigneeId = typeof inquiry.assignee === 'object' && inquiry.assignee ? inquiry.assignee.id : String(inquiry.assignee);
    if (!assigneeId) return;

    // 담당 관리자가 현재 해당 대화방에 접속 중인지 확인 (대화 중이면 인앱 알림 생략)
    if (await this.inquiryGateway.isUserInInquiryRoom(assigneeId, inquiry.id)) {
      this.logger.debug(`Assignee ${assigneeId} is active in inquiry room ${inquiry.id}. Skipping Alert creation.`);
      return;
    }

    await this.commandBus.execute(
      new CreateAlertCommand({
        userId: assigneeId,
        type: AlertType.INQUIRY_MESSAGE,
        title: ALERT_MESSAGES.INQUIRY_MESSAGE_TITLE,
        content: ALERT_MESSAGES.INQUIRY_MESSAGE_CONTENT(inquiry.title),
        linkUrl: `/inquiry-management?inquiryId=${inquiry.id}`,
      }),
    );
  }
}
