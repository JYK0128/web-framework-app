import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { InquiryWebhookService } from '#/modules/support/notification/inquiry-webhook.service';
import { SupportRoomCreatedEvent } from '#/modules/support/room/support-room-created.event';

@Injectable()
@EventsHandler(SupportRoomCreatedEvent)
export class SupportRoomCreatedWebhookHandler implements IEventHandler<SupportRoomCreatedEvent> {
  private readonly logger = new Logger(SupportRoomCreatedWebhookHandler.name);

  constructor(private readonly webhooks: InquiryWebhookService) {}

  async handle(event: SupportRoomCreatedEvent): Promise<void> {
    try {
      await this.webhooks.sendRoomCreatedWebhook(event.roomId);
    }
    catch (error) {
      this.logger.error(`Could not notify operators about support room ${event.roomId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
