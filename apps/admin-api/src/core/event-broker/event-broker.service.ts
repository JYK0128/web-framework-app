import type { IEvent } from '@nestjs/cqrs';

import type { EventBrokerConsumerOptions, IEventBrokerAdapter } from './event-broker.interface';

export class EventBroker {
  constructor(private readonly adapter: IEventBrokerAdapter) {}

  async publish<T extends IEvent>(event: T): Promise<void> {
    await this.adapter.publish(event);
  }

  async publishAll<T extends IEvent>(events: T[]): Promise<void> {
    await Promise.all(events.map((event) => this.publish(event)));
  }

  async subscribe<TPayload>(eventName: string, listener: (payload: TPayload) => void | Promise<void>, options?: EventBrokerConsumerOptions): Promise<() => Promise<void>> {
    if (!this.adapter.subscribe) throw new Error(`Event broker adapter '${this.adapter.name}' does not support subscriptions`);
    return this.adapter.subscribe(eventName, (payload) => listener(payload as TPayload), options);
  }
}
