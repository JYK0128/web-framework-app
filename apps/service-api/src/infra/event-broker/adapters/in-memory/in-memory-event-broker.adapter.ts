import { Injectable } from '@nestjs/common';
import { EventBus, type IEvent } from '@nestjs/cqrs';

import type { EventBrokerListener, IEventBrokerAdapter } from '#/infra/event-broker/event-broker.interface';

@Injectable()
export class InMemoryEventBrokerAdapter implements IEventBrokerAdapter {
  readonly name = 'in-memory';
  private readonly listeners = new Map<string, Set<EventBrokerListener>>();

  constructor(private readonly eventBus: EventBus) {}

  async publish<T extends IEvent>(event: T): Promise<void> {
    this.eventBus.publish(event);
    await Promise.all([...(this.listeners.get(event.constructor.name) ?? [])].map(async (listener) => listener(event)));
  }

  async subscribe(eventName: string, listener: EventBrokerListener): Promise<() => Promise<void>> {
    const listeners = this.listeners.get(eventName) ?? new Set<EventBrokerListener>();
    listeners.add(listener);
    this.listeners.set(eventName, listeners);
    return async () => {
      listeners.delete(listener);
      if (!listeners.size) this.listeners.delete(eventName);
    };
  }
}
