import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IEvent } from '@nestjs/cqrs';

import type { IEventBrokerAdapter } from '#/infra/event-broker/event-broker.interface';

export interface KafkaEventBrokerAdapterOptions {
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

export const KAFKA_EVENT_BROKER_ADAPTER_OPTIONS = Symbol('KAFKA_EVENT_BROKER_ADAPTER_OPTIONS');

/**
 * @stub Replace with a real Kafka client (e.g. kafkajs) before going to production.
 */
@Injectable()
export class KafkaEventBrokerAdapter implements IEventBrokerAdapter {
  readonly name = 'kafka';

  private readonly logger = new Logger(KafkaEventBrokerAdapter.name);

  constructor(
    @Inject(KAFKA_EVENT_BROKER_ADAPTER_OPTIONS)
    private readonly options: KafkaEventBrokerAdapterOptions,
  ) {}

  async publish<T extends IEvent>(event: T): Promise<void> {
    const topic = this.options.topic ?? `events.${event.constructor.name}`;
    const message = JSON.stringify({
      eventName: event.constructor.name,
      payload: event,
      publishedAt: new Date().toISOString(),
    });

    this.logger.debug(`[EventBroker:kafka] (stub) Would publish ${event.constructor.name} → ${topic}`, { message });
  }
}
