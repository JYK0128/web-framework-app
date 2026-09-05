import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { SystemContext } from '#/common/contexts/system.context';
import { SystemConfigUpdatedEvent } from '#/modules/system-config/events/system-config-updated.event';

@Injectable()
@EventsHandler(SystemConfigUpdatedEvent)
export class SystemConfigUpdatedEventHandler implements IEventHandler<SystemConfigUpdatedEvent> {
  private readonly logger = new Logger(SystemConfigUpdatedEventHandler.name);

  constructor(
    private readonly systemContext: SystemContext,
  ) {}

  async handle(event: SystemConfigUpdatedEvent): Promise<void> {
    this.logger.log(
      `[SystemConfig] Invalidation event received for keys: [${event.keys.join(', ')}]. Clearing in-memory and Redis cache.`,
    );
    await this.systemContext.clearCache(event.keys);
  }
}
