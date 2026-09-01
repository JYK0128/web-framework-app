import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { IEvent } from '@nestjs/cqrs';
import { createClient, type RedisClientOptions } from 'redis';

import type { IEventBrokerAdapter } from '#/infra/event-broker/event-broker.interface';

export interface RedisPubSubEventBrokerAdapterOptions extends RedisClientOptions {
  topic: string
}

export const REDIS_PUBSUB_EVENT_BROKER_ADAPTER_OPTIONS = Symbol('REDIS_PUBSUB_EVENT_BROKER_ADAPTER_OPTIONS');

@Injectable()
export class RedisPubSubEventBrokerAdapter implements IEventBrokerAdapter, OnModuleInit, OnModuleDestroy {
  readonly name = 'redis-pubsub';

  private readonly logger = new Logger(RedisPubSubEventBrokerAdapter.name);
  private client: ReturnType<typeof createClient> | null = null;

  constructor(
    @Inject(REDIS_PUBSUB_EVENT_BROKER_ADAPTER_OPTIONS)
    private readonly options: RedisPubSubEventBrokerAdapterOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.client?.isOpen) return;

    const client = createClient(this.options);
    client.on('error', (err) => {
      this.logger.error(`[EventBroker:redis-pubsub] Connection error: ${err instanceof Error ? err.message : String(err)}`);
    });

    try {
      await client.connect();
      this.client = client;
      this.logger.log('[EventBroker:redis-pubsub] Connected successfully');
    }
    catch (err) {
      this.logger.error(`[EventBroker:redis-pubsub] Failed to connect: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client?.isOpen) return;

    try {
      await this.client.quit();
    }
    catch (err) {
      this.logger.error(`[EventBroker:redis-pubsub] Failed to disconnect gracefully: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async publish<T extends IEvent>(event: T): Promise<void> {
    if (!this.client?.isOpen) {
      this.logger.warn(`[EventBroker:redis-pubsub] Redis client not connected — skipping ${event.constructor.name}`);
      return;
    }

    const channel = `${this.options.topic}:${event.constructor.name}`;
    const payload = JSON.stringify({
      eventName: event.constructor.name,
      payload: event,
      publishedAt: new Date().toISOString(),
    });

    try {
      await this.client.publish(channel, payload);
      this.logger.debug(`[EventBroker:redis-pubsub] Published ${event.constructor.name} → ${channel}`);
    }
    catch (err) {
      this.logger.error(`[EventBroker:redis-pubsub] Failed to publish ${event.constructor.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
