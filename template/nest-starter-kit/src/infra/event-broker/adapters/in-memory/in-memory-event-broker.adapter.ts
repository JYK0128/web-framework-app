import { Injectable } from '@nestjs/common';
import { EventBus, type IEvent } from '@nestjs/cqrs';

import type { IEventBrokerAdapter } from '#/infra/event-broker/event-broker.interface';

@Injectable()
export class InMemoryEventBrokerAdapter implements IEventBrokerAdapter {
  readonly name = 'in-memory';

  constructor(private readonly eventBus: EventBus) {}

  async publish<T extends IEvent>(event: T): Promise<void> {
    this.eventBus.publish(event);
  }
}
