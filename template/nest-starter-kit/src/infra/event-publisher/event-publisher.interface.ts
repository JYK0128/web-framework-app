import type { IEvent } from '@nestjs/cqrs';

import type { KafkaEventChannelOptions } from './channels/kafka/kafka-event.channel';
import type { RabbitMQEventChannelOptions } from './channels/rabbitmq/rabbitmq-event.channel';
import type { RedisEventChannelOptions } from './channels/redis/redis-event.channel';

export const EVENT_CHANNELS = Symbol('EVENT_CHANNELS');
export const EVENT_PUBLISHER_MODULE_OPTIONS = Symbol('EVENT_PUBLISHER_MODULE_OPTIONS');

export interface IEventChannel {
  readonly name: string
  publish<T extends IEvent>(event: T): Promise<void>
}

export interface EventPublisherModuleOptions {
  inMemory?: boolean
  redis?: RedisEventChannelOptions
  kafka?: KafkaEventChannelOptions
  rabbitmq?: RabbitMQEventChannelOptions
}
