import { Module } from '@nestjs/common';

import { EventsController } from '~/modules/event/events.controller';

@Module({ controllers: [EventsController] })
export class EventsModule {}
