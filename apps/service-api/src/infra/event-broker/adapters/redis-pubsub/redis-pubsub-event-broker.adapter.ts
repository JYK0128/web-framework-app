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
  private readonly subscriptions = new Map<string, { client: ReturnType<typeof createClient>, listeners: Set<(payload: unknown) => void> }>();

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
      this.logger.log('[EventBroker:redis-pubsub] Connected successfully.');
    }
    catch (err) {
      this.logger.error(`[EventBroker:redis-pubsub] Failed to connect: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  async onModuleDestroy(): Promise<void> {
    for (const subscription of this.subscriptions.values()) if (subscription.client.isOpen) await subscription.client.quit();
    this.subscriptions.clear();
    if (!this.client?.isOpen) return;

    try {
      await this.client.quit();
      this.logger.log('[EventBroker:redis-pubsub] Connection closed gracefully.');
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
      this.logger.log(`[EventBroker:redis-pubsub] Publishing ${event.constructor.name} to ${channel}...`);
      await this.client.publish(channel, payload);
      this.logger.log(`[EventBroker:redis-pubsub] Published ${event.constructor.name} to ${channel} successfully.`);
    }
    catch (err) {
      this.logger.error(`[EventBroker:redis-pubsub] Failed to publish ${event.constructor.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async subscribe(eventName: string, listener: (payload: unknown) => void): Promise<() => Promise<void>> {
    if (!this.client?.isOpen) throw new Error('Redis Pub/Sub event broker is not connected');
    const channel = `${this.options.topic}:${eventName}`;
    let subscription = this.subscriptions.get(channel);
    if (!subscription) {
      const client = this.client.duplicate();
      client.on('error', (error) => this.logger.error(`[EventBroker:redis-pubsub] Subscriber error: ${error instanceof Error ? error.message : String(error)}`));
      await client.connect();
      subscription = { client, listeners: new Set() };
      const current = subscription;
      this.subscriptions.set(channel, current);
      await client.subscribe(channel, (raw) => {
        try {
          const message = JSON.parse(raw) as { eventName?: string, payload?: unknown };
          if (message.eventName !== eventName || message.payload === undefined) return;
          for (const subscriber of current.listeners) subscriber(message.payload);
        }
        catch (error) {
          this.logger.warn(`[EventBroker:redis-pubsub] Invalid event payload: ${error instanceof Error ? error.message : String(error)}`);
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
