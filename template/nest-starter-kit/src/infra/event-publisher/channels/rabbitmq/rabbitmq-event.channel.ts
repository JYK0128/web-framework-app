import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IEvent } from '@nestjs/cqrs';

import type { IEventChannel } from '#/infra/event-publisher/event-publisher.interface';

export interface RabbitMQEventChannelOptions {
  url: string
  exchange?: string
  durable?: boolean
}

export const RABBITMQ_EVENT_CHANNEL_OPTIONS = Symbol('RABBITMQ_EVENT_CHANNEL_OPTIONS');

@Injectable()
export class RabbitMQEventChannel implements IEventChannel {
  readonly name = 'rabbitmq';

  private readonly logger = new Logger(RabbitMQEventChannel.name);

  constructor(
    @Inject(RABBITMQ_EVENT_CHANNEL_OPTIONS)
    private readonly options: RabbitMQEventChannelOptions,
  ) {}

  async publish<T extends IEvent>(event: T): Promise<void> {
    if (!this.options) {
      this.logger.warn(`[EventChannel:rabbitmq] Options not provided — skipping ${event.constructor.name}`);
      return;
    }

    const exchange = this.options.exchange ?? 'events';
    const routingKey = event.constructor.name;
    const message = JSON.stringify({
      eventName: event.constructor.name,
      event,
      publishedAt: new Date().toISOString(),
    });

    this.logger.debug(`[EventChannel:rabbitmq] (stub) Would publish ${event.constructor.name} → ${exchange}/${routingKey}`, { message });
  }
}
