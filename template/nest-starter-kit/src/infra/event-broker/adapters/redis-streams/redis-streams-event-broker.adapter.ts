import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { IEvent } from '@nestjs/cqrs';
import { valueIf } from '@pkg/shared/common';
import { createClient, type RedisClientOptions } from 'redis';

import type { IEventBrokerAdapter } from '#/infra/event-broker/event-broker.interface';

export interface RedisStreamsEventBrokerAdapterOptions extends RedisClientOptions {
  stream: string
  maxLen?: number
}

export const REDIS_STREAMS_EVENT_BROKER_ADAPTER_OPTIONS = Symbol('REDIS_STREAMS_EVENT_BROKER_ADAPTER_OPTIONS');

@Injectable()
export class RedisStreamsEventBrokerAdapter implements IEventBrokerAdapter, OnModuleInit, OnModuleDestroy {
  readonly name = 'redis-streams';

  private readonly logger = new Logger(RedisStreamsEventBrokerAdapter.name);
  private client: ReturnType<typeof createClient> | null = null;

  constructor(
    @Inject(REDIS_STREAMS_EVENT_BROKER_ADAPTER_OPTIONS)
    private readonly options: RedisStreamsEventBrokerAdapterOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.client?.isOpen) return;

    const client = createClient(this.options);
    client.on('error', (err) => {
      this.logger.error(`[EventBroker:redis-streams] Connection error: ${err instanceof Error ? err.message : String(err)}`);
    });

    try {
      await client.connect();
      this.client = client;
      this.logger.log(`[EventBroker:redis-streams] Connected successfully (stream: ${this.options.stream})`);
    }
    catch (err) {
      this.logger.error(`[EventBroker:redis-streams] Failed to connect: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client?.isOpen) return;

    try {
      await this.client.quit();
    }
    catch (err) {
      this.logger.error(`[EventBroker:redis-streams] Failed to disconnect gracefully: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async publish<T extends IEvent>(event: T): Promise<void> {
    if (!this.client?.isOpen) {
      this.logger.warn(`[EventBroker:redis-streams] Redis client not connected — skipping ${event.constructor.name}`);
      return;
    }

    const entryData: Record<string, string> = {
      eventName: event.constructor.name,
      payload: JSON.stringify(event),
      publishedAt: new Date().toISOString(),
    };

    const trimOptions = valueIf(Boolean(this.options.maxLen && this.options.maxLen > 0), {
      TRIM: {
        strategy: 'MAXLEN' as const,
        strategyModifier: '~' as const,
        threshold: this.options.maxLen!,
      },
    });

    try {
      const id = await this.client.xAdd(this.options.stream, '*', entryData, trimOptions);
      this.logger.debug(`[EventBroker:redis-streams] Appended ${event.constructor.name} (id: ${id}) → ${this.options.stream}`);
    }
    catch (err) {
      this.logger.error(`[EventBroker:redis-streams] Failed to append ${event.constructor.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
