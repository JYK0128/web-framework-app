import type { IEvent } from '@nestjs/cqrs';

import type { KafkaEventBrokerAdapterOptions } from './adapters/kafka/kafka-event-broker.adapter';
import type { RabbitMQEventBrokerAdapterOptions } from './adapters/rabbitmq/rabbitmq-event-broker.adapter';
import type { RedisPubSubEventBrokerAdapterOptions } from './adapters/redis-pubsub/redis-pubsub-event-broker.adapter';
import type { RedisStreamsEventBrokerAdapterOptions } from './adapters/redis-streams/redis-streams-event-broker.adapter';

export const EVENT_BROKER = {
  IN_MEMORY: Symbol('EVENT_BROKER.IN_MEMORY'),
  REDIS_PUBSUB: Symbol('EVENT_BROKER.REDIS_PUBSUB'),
  REDIS_STREAMS: Symbol('EVENT_BROKER.REDIS_STREAMS'),
  RABBITMQ: Symbol('EVENT_BROKER.RABBITMQ'),
  KAFKA: Symbol('EVENT_BROKER.KAFKA'),
} as const;

export type EventBrokerListener = (payload: unknown) => void | Promise<void>;

export interface EventBrokerConsumerOptions {
  group?: string
  consumer?: string
  retryIdleMs?: number
}

export interface IEventBrokerAdapter {
  readonly name: string
  publish<T extends IEvent>(event: T): Promise<void>
  subscribe?(eventName: string, listener: EventBrokerListener, options?: EventBrokerConsumerOptions): Promise<() => Promise<void>>
}

export interface EventBrokerModuleOptions {
  defaultAdapter?: 'in-memory' | 'redis-pubsub' | 'redis-streams' | 'rabbitmq' | 'kafka'
  redisPubSub?: RedisPubSubEventBrokerAdapterOptions
  redisStreams?: RedisStreamsEventBrokerAdapterOptions
  kafka?: KafkaEventBrokerAdapterOptions
  rabbitmq?: RabbitMQEventBrokerAdapterOptions
}
