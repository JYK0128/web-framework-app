import { Injectable } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { SystemContext } from '#/common/contexts/system.context';
import { SystemConfigUpdatedEvent } from '#/modules/system-config/events/system-config-updated.event';

@Injectable()
@EventsHandler(SystemConfigUpdatedEvent)
export class SystemConfigUpdatedEventHandler implements IEventHandler<SystemConfigUpdatedEvent> {
  constructor(
    private readonly systemContext: SystemContext,
  ) {}

  async handle(event: SystemConfigUpdatedEvent): Promise<void> {
    await this.systemContext.clearCache(event.keys);
  }
}
