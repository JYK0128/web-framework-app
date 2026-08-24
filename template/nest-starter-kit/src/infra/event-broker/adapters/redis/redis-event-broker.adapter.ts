import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { IEvent } from '@nestjs/cqrs';
import { createClient, type RedisClientOptions } from 'redis';

import type { IEventBrokerAdapter } from '#/infra/event-broker/event-broker.interface';

export interface RedisEventBrokerAdapterOptions extends RedisClientOptions {
  topic: string
}

export const REDIS_EVENT_BROKER_ADAPTER_OPTIONS = Symbol('REDIS_EVENT_BROKER_ADAPTER_OPTIONS');

@Injectable()
export class RedisEventBrokerAdapter implements IEventBrokerAdapter, OnModuleInit, OnModuleDestroy {
  readonly name = 'redis';

  private readonly logger = new Logger(RedisEventBrokerAdapter.name);
  private client: ReturnType<typeof createClient> | null = null;

  constructor(
    @Inject(REDIS_EVENT_BROKER_ADAPTER_OPTIONS)
    private readonly options: RedisEventBrokerAdapterOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.client?.isOpen) return;

    const client = createClient(this.options);
    client.on('error', (err) => {
      this.logger.error(`[EventBroker:redis] Connection error: ${err instanceof Error ? err.message : String(err)}`);
    });

    await client.connect();
    this.client = client;
    this.logger.log('[EventBroker:redis] Connected successfully');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit();
    }
  }

  async publish<T extends IEvent>(event: T): Promise<void> {
    if (!this.client?.isOpen) {
      this.logger.warn(`[EventBroker:redis] Redis client not connected — skipping ${event.constructor.name}`);
      return;
    }

    const channel = `${this.options.topic}:${event.constructor.name}`;
    const payload = JSON.stringify({
      eventName: event.constructor.name,
      event,
      publishedAt: new Date().toISOString(),
    });

    try {
      await this.client.publish(channel, payload);
      this.logger.debug(`[EventBroker:redis] Published ${event.constructor.name} → ${channel}`);
    }
    catch (error) {
      this.logger.error(`[EventBroker:redis] Failed to publish ${event.constructor.name}:`, error);
    }
  }
}
