import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IEvent } from '@nestjs/cqrs';

import { DEFAULT_EVENT_BROKER_ADAPTER } from '#/common/configs/runtime.config';

import { EVENT_BROKER_ADAPTERS, type IEventBrokerAdapter } from './event-broker.interface';

export interface EventBrokerPublishOptions {
  adapter?: string
}

export interface EventBrokerSubscribeOptions {
  adapter?: string
}

@Injectable()
export class EventBroker {
  private readonly logger = new Logger(EventBroker.name);
  private readonly adapterMap = new Map<string, IEventBrokerAdapter>();

  constructor(
    @Inject(EVENT_BROKER_ADAPTERS)
    adapters: IEventBrokerAdapter[],
  ) {
    for (const adapter of adapters) {
      this.adapterMap.set(adapter.name, adapter);
    }
  }

  async publish<T extends IEvent>(event: T, options?: EventBrokerPublishOptions): Promise<void> {
    const eventName = event.constructor.name;
    const targets = this.resolveAdapters(options?.adapter);

    for (const adapter of targets) {
      try {
        await adapter.publish(event);
      }
      catch (error: unknown) {
        this.logger.error(`Failed to publish event ${eventName} through adapter ${adapter.name}:`, error);
      }
    }
  }

  async publishAll<T extends IEvent>(events: T[], options?: EventBrokerPublishOptions): Promise<void> {
    await Promise.allSettled(events.map((event) => this.publish(event, options)));
  }

  async subscribe<TPayload>(eventName: string, listener: (payload: TPayload) => void, options?: EventBrokerSubscribeOptions): Promise<() => Promise<void>> {
    const adapters = this.resolveAdapters(options?.adapter);
    const unsubscribers = await Promise.all(adapters.map((adapter) => {
      if (!adapter.subscribe) throw new Error(`Event broker adapter '${adapter.name}' does not support subscriptions`);
      return adapter.subscribe(eventName, (payload) => listener(payload as TPayload));
    }));
    return async () => {
      await Promise.all(unsubscribers.map((unsubscribe) => unsubscribe()));
    };
  }

  private resolveAdapters(name?: string): IEventBrokerAdapter[] {
    const target = name ?? DEFAULT_EVENT_BROKER_ADAPTER;
    const adapter = this.adapterMap.get(target);
    if (!adapter) {
      this.logger.warn(`[EventBroker] Adapter '${target}' is not registered — skipping`);
      return [];
    }
    return [adapter];
  }
}
