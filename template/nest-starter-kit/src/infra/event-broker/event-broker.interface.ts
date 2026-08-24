import type { IEvent } from '@nestjs/cqrs';

import type { KafkaEventBrokerAdapterOptions } from './adapters/kafka/kafka-event-broker.adapter';
import type { RabbitMQEventBrokerAdapterOptions } from './adapters/rabbitmq/rabbitmq-event-broker.adapter';
import type { RedisEventBrokerAdapterOptions } from './adapters/redis/redis-event-broker.adapter';

export const EVENT_BROKER_ADAPTERS = Symbol('EVENT_BROKER_ADAPTERS');
export const EVENT_BROKER_MODULE_OPTIONS = Symbol('EVENT_BROKER_MODULE_OPTIONS');

export interface IEventBrokerAdapter {
  readonly name: string
  publish<T extends IEvent>(event: T): Promise<void>
}

export interface EventBrokerModuleOptions {
  inMemory?: boolean
  redis?: RedisEventBrokerAdapterOptions
  kafka?: KafkaEventBrokerAdapterOptions
  rabbitmq?: RabbitMQEventBrokerAdapterOptions
}
