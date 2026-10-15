import { HttpStatus, Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { IEvent } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { createClient, type RedisClientOptions } from 'redis';

import type { BrokerAdapter, BrokerListener } from '#event-broker/event-broker.interface';

export interface RedisPubSubAdapterOptions extends RedisClientOptions {
  topic: string
}

export const REDIS_PUBSUB_ADAPTER_OPTIONS = Symbol('REDIS_PUBSUB_ADAPTER_OPTIONS');

@Injectable()
export class RedisPubSubAdapter implements BrokerAdapter, OnModuleInit, OnModuleDestroy {
  readonly name = 'redis-pubsub';

  private readonly logger = new Logger(RedisPubSubAdapter.name);
  private client: ReturnType<typeof createClient> | null = null;
  private readonly subscriptions = new Map<string, { client: ReturnType<typeof createClient>, listeners: Set<BrokerListener> }>();

  constructor(
    @Inject(REDIS_PUBSUB_ADAPTER_OPTIONS)
    private readonly options: RedisPubSubAdapterOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.client?.isOpen) return;

    const client = createClient(this.options);
    client.on('error', (err) => {
      this.logger.error(`[Broker:redis-pubsub] Connection error: ${err instanceof Error ? err.message : String(err)}`);
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
          this.logger.error(`[Broker:redis-pubsub] Failed to clean up after connection failure: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
        }
      }
      throw error;
    }
    this.client = client;
    this.logger.log('[Broker:redis-pubsub] Connected successfully.');
  }

  async onModuleDestroy(): Promise<void> {
    for (const subscription of this.subscriptions.values()) if (subscription.client.isOpen) await subscription.client.quit();
    this.subscriptions.clear();
    if (!this.client?.isOpen) return;

    try {
      await this.client.quit();
      this.logger.log('[Broker:redis-pubsub] Connection closed gracefully.');
    }
    catch (err) {
      this.logger.error(`[Broker:redis-pubsub] Failed to disconnect gracefully: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async publish<T extends IEvent>(event: T): Promise<void> {
    if (!this.client?.isOpen) {
      throw new ApplicationError({ code: 'INTERNAL_SERVICE_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
    }

    const channel = `${this.options.topic}:${event.constructor.name}`;
    const payload = JSON.stringify({
      eventName: event.constructor.name,
      payload: event,
      publishedAt: new Date().toISOString(),
    });

    this.logger.log(`[Broker:redis-pubsub] Publishing ${event.constructor.name} to ${channel}...`);
    await this.client.publish(channel, payload);
    this.logger.log(`[Broker:redis-pubsub] Published ${event.constructor.name} to ${channel} successfully.`);
  }

  async subscribe(eventName: string, listener: BrokerListener): Promise<() => Promise<void>> {
    if (!this.client?.isOpen) throw new ApplicationError({ code: 'INTERNAL_SERVICE_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
    const channel = `${this.options.topic}:${eventName}`;
    let subscription = this.subscriptions.get(channel);
    if (!subscription) {
      const client = this.client.duplicate();
      client.on('error', (error) => this.logger.error(`[Broker:redis-pubsub] Subscriber error: ${error instanceof Error ? error.message : String(error)}`));
      await client.connect();
      subscription = { client, listeners: new Set() };
      const current = subscription;
      this.subscriptions.set(channel, current);
      await client.subscribe(channel, async (raw) => {
        try {
          const message = JSON.parse(raw) as { eventName?: string, payload?: unknown };
          if (message.eventName !== eventName || message.payload === undefined) return;
          await Promise.all([...current.listeners].map(async (subscriber) => subscriber(message.payload)));
        }
        catch (error) {
          this.logger.warn(`[Broker:redis-pubsub] Event processing failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
    }
    subscription.listeners.add(listener);
    const current = subscription;
    return async () => {
      current.listeners.delete(listener);
      if (current.listeners.size === 0 && this.subscriptions.get(channel) === current) {
        this.subscriptions.delete(channel);
        if (current.client.isOpen) await current.client.quit();
      }
    };
  }
}
