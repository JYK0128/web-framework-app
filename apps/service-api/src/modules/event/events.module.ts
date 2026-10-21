import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateEventHandler } from '~/modules/event/create-event.handler';
import { DeleteEventHandler } from '~/modules/event/delete-event.handler';
import { EventsController } from '~/modules/event/events.controller';
import { GetEventHandler } from '~/modules/event/get-event.handler';
import { GetEventsHandler } from '~/modules/event/get-events.handler';
import { GetPublicEventsHandler } from '~/modules/event/get-public-events.handler';
import { InternalEventsController } from '~/modules/event/internal-events.controller';
import { UpdateEventHandler } from '~/modules/event/update-event.handler';

@Module({
  imports: [CqrsModule],
  controllers: [EventsController, InternalEventsController],
  providers: [GetEventsHandler, GetPublicEventsHandler, GetEventHandler, CreateEventHandler, UpdateEventHandler, DeleteEventHandler],
})
export class EventsModule {}
