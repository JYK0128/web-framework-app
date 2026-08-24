import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IEvent } from '@nestjs/cqrs';

import { EVENT_BROKER_ADAPTERS, type IEventBrokerAdapter } from './event-broker.interface';

export interface EventBrokerPublishOptions {
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

    this.logger.debug(`[Event Published] ${eventName}`, {
      event,
      adapters: targets.map((adapter) => adapter.name),
    });

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
    for (const event of events) {
      await this.publish(event, options);
    }
  }

  private resolveAdapters(name?: string): IEventBrokerAdapter[] {
    const target = name ?? 'in-memory';
    const adapter = this.adapterMap.get(target);
    if (!adapter) {
      this.logger.warn(`[EventBroker] Adapter '${target}' is not registered — skipping`);
      return [];
    }
    return [adapter];
  }
}
