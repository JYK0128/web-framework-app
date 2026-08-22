import { Injectable } from '@nestjs/common';
import { EventBus, type IEvent } from '@nestjs/cqrs';

import type { IEventChannel } from '#/infra/event-publisher/event-publisher.interface';

@Injectable()
export class InMemoryEventChannel implements IEventChannel {
  readonly name = 'in-memory';

  constructor(private readonly eventBus: EventBus) {}

  async publish<T extends IEvent>(event: T): Promise<void> {
    this.eventBus.publish(event);
  }
}
