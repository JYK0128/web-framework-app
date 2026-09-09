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
    const keys = this.identify(event);
    this.verify(keys);
    await this.process(keys);
  }

  private identify(event: SystemConfigUpdatedEvent): SystemConfigUpdatedEvent['keys'] {
    return event.keys;
  }

  private verify(keys: SystemConfigUpdatedEvent['keys']): void {
    if (!Array.isArray(keys)) {
      throw new Error('시스템 설정 변경 이벤트를 확인할 수 없습니다.');
    }
  }

  private async process(keys: SystemConfigUpdatedEvent['keys']): Promise<void> {
    await this.systemContext.clearCache(keys);
  }
}
