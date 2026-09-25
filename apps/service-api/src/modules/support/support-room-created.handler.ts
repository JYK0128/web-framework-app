import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { SupportAlertService } from './support-alert.service';
import { SupportRoomCreatedEvent } from './support-room-created.event';

@Injectable()
@EventsHandler(SupportRoomCreatedEvent)
export class SupportRoomCreatedHandler implements IEventHandler<SupportRoomCreatedEvent> {
  private readonly logger = new Logger(SupportRoomCreatedHandler.name);

  constructor(private readonly alertService: SupportAlertService) {}

  async handle(event: SupportRoomCreatedEvent): Promise<void> {
    try {
      await this.alertService.sendRoomCreatedAlert(event.roomId);
    }
    catch (error) {
      this.logger.error(`Could not notify operators about support room ${event.roomId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
