import type { IEvent } from '@nestjs/cqrs';

import type { KafkaAdapterOptions } from './adapters/kafka.adapter';
import type { RabbitMQAdapterOptions } from './adapters/rabbitmq.adapter';
import type { RedisPubSubAdapterOptions } from './adapters/redis-pubsub.adapter';
import type { RedisStreamsAdapterOptions } from './adapters/redis-streams.adapter';

export const EVENT_BROKER = {
  IN_MEMORY: Symbol('EVENT_BROKER.IN_MEMORY'),
  REDIS_PUBSUB: Symbol('EVENT_BROKER.REDIS_PUBSUB'),
  REDIS_STREAMS: Symbol('EVENT_BROKER.REDIS_STREAMS'),
  RABBITMQ: Symbol('EVENT_BROKER.RABBITMQ'),
  KAFKA: Symbol('EVENT_BROKER.KAFKA'),
} as const;

export type BrokerListener = (payload: unknown) => void | Promise<void>;

export interface BrokerConsumerOptions {
  group?: string
  consumer?: string
  retryIdleMs?: number
}

export interface BrokerAdapter {
  readonly name: string
  publish<T extends IEvent>(event: T): Promise<void>
  subscribe?(eventName: string, listener: BrokerListener, options?: BrokerConsumerOptions): Promise<() => Promise<void>>
}

export interface EventBrokerModuleOptions {
  defaultAdapter?: 'in-memory' | 'redis-pubsub' | 'redis-streams' | 'rabbitmq' | 'kafka'
  redisPubSub?: RedisPubSubAdapterOptions
  redisStreams?: RedisStreamsAdapterOptions
  kafka?: KafkaAdapterOptions
  rabbitmq?: RabbitMQAdapterOptions
}
