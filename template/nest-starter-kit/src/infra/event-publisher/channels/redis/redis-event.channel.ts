import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { IEvent } from '@nestjs/cqrs';
import { createClient, type RedisClientOptions } from 'redis';

import type { IEventChannel } from '#/infra/event-publisher/event-publisher.interface';

export interface RedisEventChannelOptions extends RedisClientOptions {
  topic: string
}

export const REDIS_EVENT_CHANNEL_OPTIONS = Symbol('REDIS_EVENT_CHANNEL_OPTIONS');

@Injectable()
export class RedisEventChannel implements IEventChannel, OnModuleInit, OnModuleDestroy {
  readonly name = 'redis';

  private readonly logger = new Logger(RedisEventChannel.name);
  private client: ReturnType<typeof createClient> | null = null;

  constructor(
    @Inject(REDIS_EVENT_CHANNEL_OPTIONS)
    private readonly options: RedisEventChannelOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.client?.isOpen) return;

    const client = createClient(this.options);
    client.on('error', (err) => {
      this.logger.error(`[EventChannel:redis] Connection error: ${err instanceof Error ? err.message : String(err)}`);
    });

    await client.connect();
    this.client = client;
    this.logger.log('[EventChannel:redis] Connected successfully');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit();
    }
  }

  async publish<T extends IEvent>(event: T): Promise<void> {
    if (!this.client?.isOpen) {
      this.logger.warn(`[EventChannel:redis] Redis client not connected — skipping ${event.constructor.name}`);
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
      this.logger.debug(`[EventChannel:redis] Published ${event.constructor.name} → ${channel}`);
    }
    catch (error) {
      this.logger.error(`[EventChannel:redis] Failed to publish ${event.constructor.name}:`, error);
    }
  }
}
