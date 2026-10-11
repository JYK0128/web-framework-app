import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

import { HttpStatus, Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { IEvent } from '@nestjs/cqrs';
import { ApplicationError, valueIf } from '@pkg/shared/common';
import { createClient, type RedisClientOptions } from 'redis';
import { z } from 'zod';

import type { BrokerAdapter, BrokerConsumerOptions, BrokerListener } from '#/core/event-broker/event-broker.interface';

export interface RedisStreamsAdapterOptions extends RedisClientOptions {
  stream: string
  maxLen?: number
}

export const REDIS_STREAMS_ADAPTER_OPTIONS = Symbol('REDIS_STREAMS_ADAPTER_OPTIONS');

@Injectable()
export class RedisStreamsAdapter implements BrokerAdapter, OnModuleInit, OnModuleDestroy {
  readonly name = 'redis-streams';

  private readonly logger = new Logger(RedisStreamsAdapter.name);
  private readonly subscriptions = new Set<() => Promise<void>>();
  private client: ReturnType<typeof createClient> | null = null;

  constructor(
    @Inject(REDIS_STREAMS_ADAPTER_OPTIONS)
    private readonly options: RedisStreamsAdapterOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.client?.isOpen) return;

    const client = createClient(this.options);
    client.on('error', (err) => {
      this.logger.error(`[Broker:redis-streams] Connection error: ${err instanceof Error ? err.message : String(err)}`);
    });

    try {
      await client.connect();
    }
    catch (error) {
      if (client.isOpen) {
        try {
          await client.quit();
        }
        catch (cleanupError) {
          this.logger.error(`[Broker:redis-streams] Failed to clean up after connection failure: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
        }
      }
      throw error;
    }
    this.client = client;
    this.logger.log('[Broker:redis-streams] Connected successfully.');
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.subscriptions].map((stop) => stop()));
    if (!this.client?.isOpen) return;

    try {
      await this.client.quit();
      this.logger.log('[Broker:redis-streams] Connection closed gracefully.');
    }
    catch (err) {
      this.logger.error(`[Broker:redis-streams] Failed to disconnect gracefully: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async publish<T extends IEvent>(event: T): Promise<void> {
    if (!this.client?.isOpen) {
      throw new ApplicationError({ code: 'INTERNAL_SERVICE_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
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

    this.logger.log(`[Broker:redis-streams] Appending ${event.constructor.name} to ${this.options.stream}...`);
    await this.client.xAdd(this.options.stream, '*', entryData, trimOptions);
    this.logger.log(`[Broker:redis-streams] Appended ${event.constructor.name} to ${this.options.stream} successfully.`);
  }

  async subscribe(eventName: string, listener: BrokerListener, options?: BrokerConsumerOptions): Promise<() => Promise<void>> {
    if (!options?.group) throw new ApplicationError({ code: 'BAD_REQUEST', status: HttpStatus.BAD_REQUEST });
    if (!this.client?.isOpen) throw new ApplicationError({ code: 'INTERNAL_SERVICE_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
    const retryIdleMs = options.retryIdleMs ?? 30_000;
    if (!Number.isFinite(retryIdleMs) || retryIdleMs <= 0) throw new ApplicationError({ code: 'BAD_REQUEST', status: HttpStatus.BAD_REQUEST });
    const client = this.client.duplicate();
    client.on('error', (error) => this.logger.error(`Redis Streams subscriber error: ${String(error)}`));
    await client.connect();
    const group = `${options.group}:${eventName}`;
    const consumer = options.consumer ?? randomUUID();
    try {
      await client.xGroupCreate(this.options.stream, group, '0', { MKSTREAM: true });
    }
    catch (error) {
      if (!(error instanceof Error) || !error.message.includes('BUSYGROUP')) {
        client.destroy();
        throw error;
      }
    }
    let stopped = false;
    let cursor = '0-0';
    const consume = async (entries: Array<{ id: string, message: Record<string, string> }>): Promise<void> => {
      for (const entry of entries) {
        if (stopped) return;
        try {
          if (entry.message.eventName === eventName) {
            const payload: unknown = JSON.parse(entry.message.payload);
            await listener(payload);
          }
          await client.xAck(this.options.stream, group, entry.id);
        }
        catch (error) {
          this.logger.error(`Redis Streams event ${entry.id} remains pending: ${String(error)}`);
        }
      }
    };
    const run = async (): Promise<void> => {
      while (!stopped) {
        try {
          const pending = await client.xAutoClaim(this.options.stream, group, consumer, retryIdleMs, cursor, { COUNT: 10 });
          cursor = pending.nextId;
          await consume(pending.messages.filter((entry): entry is NonNullable<typeof entry> => entry !== null));
          const batches = await client.xReadGroup(group, consumer, { key: this.options.stream, id: '>' }, { COUNT: 10, BLOCK: 1000 });
          const parsed = z.array(z.object({ messages: z.array(z.object({ id: z.string(), message: z.record(z.string(), z.string()) })) })).nullable().parse(batches);
          for (const batch of parsed ?? []) await consume(batch.messages);
        }
        catch (error) {
          if (stopped) return;
          this.logger.error(`Redis Streams consumer failed: ${String(error)}`);
          await delay(1000);
        }
      }
    };
    const task = run();
    const stop = async (): Promise<void> => {
      if (stopped) return;
      stopped = true;
      this.subscriptions.delete(stop);
      if (client.isOpen) client.destroy();
      await task;
    };
    this.subscriptions.add(stop);
    return stop;
  }
}
