import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { SLACK_ALERT_TEMPLATES } from '#/common/constants/alert.constants';
import { env } from '#/env';
import { MessengerChannel } from '#/infra/notification';
import { InquiryCreatedEvent } from '#/modules/inquiries/events';

@Injectable()
@EventsHandler(InquiryCreatedEvent)
export class SendInquiryCreatedSlackAlertEventHandler implements IEventHandler<InquiryCreatedEvent> {
  private readonly logger = new Logger(SendInquiryCreatedSlackAlertEventHandler.name);

  constructor(private readonly messenger: MessengerChannel) {}

  async handle(event: InquiryCreatedEvent): Promise<void> {
    const { inquiry, author } = event;
    const directLink = `${env.FRONTEND_URL}/inquiry-management?inquiryId=${inquiry.id}`;
    const template = SLACK_ALERT_TEMPLATES.INQUIRY_CREATED;

    const sent = await this.messenger.sendNotification({
      level: 'info',
      title: template.TITLE,
      sections: [
        { label: template.LABELS.TITLE, value: inquiry.title },
        { label: template.LABELS.CONTENT, value: inquiry.content },
      ],
      fields: [
        { label: template.LABELS.CATEGORY, value: inquiry.category },
        { label: template.LABELS.AUTHOR, value: author.name || author.email || template.LABELS.UNKNOWN_AUTHOR },
      ],
      action: {
        text: template.ACTION_TEXT,
        url: directLink,
      },
      footer: template.FOOTER,
    });

    if (sent) {
      this.logger.log(`[Slack Sent] New Inquiry: [${inquiry.id}] "${inquiry.title}"`);
    }
  }
}
