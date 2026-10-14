import { Module } from '@nestjs/common';

import { EventsController } from '#/modules/events/events.controller';

@Module({ controllers: [EventsController] })
export class EventsModule {}
