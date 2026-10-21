import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { QnaCreatedEvent } from '~/modules/qna/qna-created.event';
import { InquiryWebhookService } from '~/modules/support/notification/inquiry-webhook.service';

@Injectable()
@EventsHandler(QnaCreatedEvent)
export class QnaCreatedWebhookHandler implements IEventHandler<QnaCreatedEvent> {
  private readonly logger = new Logger(QnaCreatedWebhookHandler.name);

  constructor(private readonly webhooks: InquiryWebhookService) {}

  async handle(event: QnaCreatedEvent): Promise<void> {
    try {
      await this.webhooks.sendQnaCreatedWebhook(event.qnaId, event.priority);
    }
    catch (error) {
      this.logger.error(`Could not notify operators about Q&A ${event.qnaId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
