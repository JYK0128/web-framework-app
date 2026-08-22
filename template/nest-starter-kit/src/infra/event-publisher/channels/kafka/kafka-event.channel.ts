import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IEvent } from '@nestjs/cqrs';

import type { IEventChannel } from '#/infra/event-publisher/event-publisher.interface';

export interface KafkaEventChannelOptions {
  brokers: string[]
  clientId?: string
  topic?: string
  ssl?: boolean
  sasl?: {
    mechanism?: 'plain' | 'scram-sha-256' | 'scram-sha-512'
    username?: string
    password?: string
  }
}

export const KAFKA_EVENT_CHANNEL_OPTIONS = Symbol('KAFKA_EVENT_CHANNEL_OPTIONS');

@Injectable()
export class KafkaEventChannel implements IEventChannel {
  readonly name = 'kafka';

  private readonly logger = new Logger(KafkaEventChannel.name);

  constructor(
    @Inject(KAFKA_EVENT_CHANNEL_OPTIONS)
    private readonly options: KafkaEventChannelOptions,
  ) {}

  async publish<T extends IEvent>(event: T): Promise<void> {
    if (!this.options) {
      this.logger.warn(`[EventChannel:kafka] Options not provided — skipping ${event.constructor.name}`);
      return;
    }

    const topic = this.options.topic ?? `events.${event.constructor.name}`;
    const message = JSON.stringify({
      eventName: event.constructor.name,
      event,
      publishedAt: new Date().toISOString(),
    });

    this.logger.debug(`[EventChannel:kafka] (stub) Would publish ${event.constructor.name} → ${topic}`, { message });
  }
}
