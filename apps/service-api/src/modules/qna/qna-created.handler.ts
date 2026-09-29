import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { InquiryAlertService } from '#/modules/support/inquiry-alert.service';

import { QnaCreatedEvent } from './qna-created.event';

@Injectable()
@EventsHandler(QnaCreatedEvent)
export class QnaCreatedHandler implements IEventHandler<QnaCreatedEvent> {
  private readonly logger = new Logger(QnaCreatedHandler.name);

  constructor(private readonly alertService: InquiryAlertService) {}

  async handle(event: QnaCreatedEvent): Promise<void> {
    try {
      await this.alertService.sendQnaCreatedAlert(event.qnaId, event.priority);
    }
    catch (error) {
      this.logger.error(`Could not notify operators about Q&A ${event.qnaId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
