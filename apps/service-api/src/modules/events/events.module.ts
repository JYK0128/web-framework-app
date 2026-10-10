import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { EventsController } from './events.controller';
import { CreateEventHandler, DeleteEventHandler, GetEventHandler, GetEventsHandler, GetPublicEventsHandler, UpdateEventHandler } from './events.handlers';
import { InternalEventsController } from './internal-events.controller';

@Module({
  imports: [CqrsModule],
  controllers: [EventsController, InternalEventsController],
  providers: [GetEventsHandler, GetPublicEventsHandler, GetEventHandler, CreateEventHandler, UpdateEventHandler, DeleteEventHandler],
})
export class EventsModule {}
