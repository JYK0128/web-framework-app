import type { IEvent } from '@nestjs/cqrs';

import type { KafkaEventBrokerAdapterOptions } from './adapters/kafka/kafka-event-broker.adapter';
import type { RabbitMQEventBrokerAdapterOptions } from './adapters/rabbitmq/rabbitmq-event-broker.adapter';
import type { RedisPubSubEventBrokerAdapterOptions } from './adapters/redis-pubsub/redis-pubsub-event-broker.adapter';
import type { RedisStreamsEventBrokerAdapterOptions } from './adapters/redis-streams/redis-streams-event-broker.adapter';

export const EVENT_BROKER_ADAPTERS = Symbol('EVENT_BROKER_ADAPTERS');
export const EVENT_BROKER_MODULE_OPTIONS = Symbol('EVENT_BROKER_MODULE_OPTIONS');

export interface IEventBrokerAdapter {
  readonly name: string
  publish<T extends IEvent>(event: T): Promise<void>
}

export interface EventBrokerModuleOptions {
  redisPubSub?: RedisPubSubEventBrokerAdapterOptions
  redisStreams?: RedisStreamsEventBrokerAdapterOptions
  kafka?: KafkaEventBrokerAdapterOptions
  rabbitmq?: RabbitMQEventBrokerAdapterOptions
}
