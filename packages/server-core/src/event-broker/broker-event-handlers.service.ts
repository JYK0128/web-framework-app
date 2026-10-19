/* eslint-disable import-x/extensions -- Node ESM requires the external Nest metadata module extension. */
import { HttpStatus, Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy, type Type } from '@nestjs/common';
import { DiscoveryService, ModuleRef, Reflector } from '@nestjs/core';
import type { IEvent, IEventHandler } from '@nestjs/cqrs';
import { EVENTS_HANDLER_METADATA } from '@nestjs/cqrs/dist/decorators/constants.js';
import { ApplicationError } from '@pkg/shared/common';

import { BROKER_CONSUMER_METADATA, type BrokerConsumerMetadata } from './broker-consumer.decorator';
import type { BrokerConsumerOptions } from './event-broker.interface';
import { EventBroker } from './event-broker.service';

interface HandlerSubscription {
  broker: EventBroker
  event: Type<IEvent>
  options: BrokerConsumerOptions
  handlers: Type<IEventHandler>[]
}

@Injectable()
export class BrokerEventHandlers implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(BrokerEventHandlers.name);
  private readonly stops: (() => Promise<void>)[] = [];

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const subscriptions = this.discoverSubscriptions();

    try {
      for (const { broker, event, options, handlers } of subscriptions) {
        const stop = await broker.subscribe<unknown>(event.name, async (payload) => {
          if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
            throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: HttpStatus.INTERNAL_SERVER_ERROR });
          }
          const instance = Object.assign(Object.create(event.prototype as object) as IEvent, payload);
          for (const type of handlers) {
            const handler = await this.moduleRef.resolve(type, undefined, { strict: false });
            await handler.handle(instance);
          }
        }, options);
        this.stops.push(stop);
      }
    }
    catch (error) {
      const cleanup = await Promise.allSettled(this.stops.splice(0).map((stop) => stop()));
      for (const result of cleanup) {
        if (result.status === 'rejected') this.logger.error('Failed to stop broker handler subscription after startup failure', result.reason);
      }
      throw error;
    }
  }

  private discoverSubscriptions(): HandlerSubscription[] {
    const subscriptions: HandlerSubscription[] = [];
    for (const wrapper of this.discovery.getProviders()) {
      if (!wrapper.metatype) continue;
      const metadata = this.reflector.get<BrokerConsumerMetadata>(BROKER_CONSUMER_METADATA, wrapper.metatype);
      if (!metadata) continue;
      const events = this.reflector.get<Type<IEvent>[]>(EVENTS_HANDLER_METADATA, wrapper.metatype);
      if (!events?.length) throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: HttpStatus.INTERNAL_SERVER_ERROR });
      const broker = this.moduleRef.get<EventBroker>(metadata.broker ?? EventBroker, { strict: false });
      // In-memory publication already invokes @EventsHandler through the Nest EventBus.
      if (broker.adapterName === 'in-memory') continue;
      const { broker: _broker, ...options } = metadata;
      for (const event of events) {
        this.addSubscription(subscriptions, broker, event, options, wrapper.metatype as Type<IEventHandler>);
      }
    }

    return subscriptions;
  }

  private addSubscription(
    subscriptions: HandlerSubscription[], broker: EventBroker, event: Type<IEvent>,
    options: BrokerConsumerOptions, handler: Type<IEventHandler>,
  ): void {
    let subscription = subscriptions.find((item) => item.broker === broker && item.event === event
      && item.options.group === options.group && item.options.consumer === options.consumer
      && item.options.retryIdleMs === options.retryIdleMs);
    if (!subscription) {
      subscription = { broker, event, options, handlers: [] };
      subscriptions.push(subscription);
    }
    if (!subscription.handlers.includes(handler)) subscription.handlers.push(handler);
  }

  async onModuleDestroy(): Promise<void> {
    const results = await Promise.allSettled(this.stops.splice(0).map((stop) => stop()));
    const failure = results.find((result) => result.status === 'rejected');
    if (failure?.status === 'rejected') throw failure.reason;
  }
}
