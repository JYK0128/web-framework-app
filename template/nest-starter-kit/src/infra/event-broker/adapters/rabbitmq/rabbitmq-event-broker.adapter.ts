import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IEvent } from '@nestjs/cqrs';

import type { IEventBrokerAdapter } from '#/infra/event-broker/event-broker.interface';

export interface RabbitMQEventBrokerAdapterOptions {
  url: string
  exchange?: string
  durable?: boolean
}

export const RABBITMQ_EVENT_BROKER_ADAPTER_OPTIONS = Symbol('RABBITMQ_EVENT_BROKER_ADAPTER_OPTIONS');

@Injectable()
export class RabbitMQEventBrokerAdapter implements IEventBrokerAdapter {
  readonly name = 'rabbitmq';

  private readonly logger = new Logger(RabbitMQEventBrokerAdapter.name);

  constructor(
    @Inject(RABBITMQ_EVENT_BROKER_ADAPTER_OPTIONS)
    private readonly options: RabbitMQEventBrokerAdapterOptions,
  ) {}

  async publish<T extends IEvent>(event: T): Promise<void> {
    if (!this.options) {
      this.logger.warn(`[EventBroker:rabbitmq] Options not provided — skipping ${event.constructor.name}`);
      return;
    }

    const exchange = this.options.exchange ?? 'events';
    const routingKey = event.constructor.name;
    const message = JSON.stringify({
      eventName: event.constructor.name,
      event,
      publishedAt: new Date().toISOString(),
    });

    this.logger.debug(`[EventBroker:rabbitmq] (stub) Would publish ${event.constructor.name} → ${exchange}/${routingKey}`, { message });
  }
}
