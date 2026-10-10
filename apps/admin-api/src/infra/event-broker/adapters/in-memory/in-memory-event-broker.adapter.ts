import { Injectable } from '@nestjs/common';
import { EventBus, type IEvent } from '@nestjs/cqrs';

import { DEFAULT_EVENT_BROKER_ADAPTER } from '#/common/configs/runtime.config';
import type { IEventBrokerAdapter } from '#/infra/event-broker/event-broker.interface';

@Injectable()
export class InMemoryEventBrokerAdapter implements IEventBrokerAdapter {
  readonly name = DEFAULT_EVENT_BROKER_ADAPTER;

  constructor(private readonly eventBus: EventBus) {}

  publish<T extends IEvent>(event: T): Promise<void> {
    this.eventBus.publish(event);
    return Promise.resolve();
  }
}
