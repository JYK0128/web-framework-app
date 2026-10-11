import { HttpStatus } from '@nestjs/common';
import type { IEvent } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import type { BrokerAdapter, BrokerConsumerOptions } from './event-broker.interface';

export class EventBroker {
  constructor(private readonly adapter: BrokerAdapter) {}

  async publish<T extends IEvent>(event: T): Promise<void> {
    await this.adapter.publish(event);
  }

  async publishAll<T extends IEvent>(events: T[]): Promise<void> {
    await Promise.all(events.map((event) => this.publish(event)));
  }

  async subscribe<TPayload>(eventName: string, listener: (payload: TPayload) => void | Promise<void>, options?: BrokerConsumerOptions): Promise<() => Promise<void>> {
    if (!this.adapter.subscribe) throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: HttpStatus.INTERNAL_SERVER_ERROR });
    return this.adapter.subscribe(eventName, (payload) => listener(payload as TPayload), options);
  }
}
