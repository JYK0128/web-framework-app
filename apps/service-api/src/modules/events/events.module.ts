import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateEventHandler } from '#/modules/events/create-event.handler';
import { DeleteEventHandler } from '#/modules/events/delete-event.handler';
import { EventsController } from '#/modules/events/events.controller';
import { GetEventHandler } from '#/modules/events/get-event.handler';
import { GetEventsHandler } from '#/modules/events/get-events.handler';
import { GetPublicEventsHandler } from '#/modules/events/get-public-events.handler';
import { InternalEventsController } from '#/modules/events/internal-events.controller';
import { UpdateEventHandler } from '#/modules/events/update-event.handler';

@Module({
  imports: [CqrsModule],
  controllers: [EventsController, InternalEventsController],
  providers: [GetEventsHandler, GetPublicEventsHandler, GetEventHandler, CreateEventHandler, UpdateEventHandler, DeleteEventHandler],
})
export class EventsModule {}
