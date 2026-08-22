import { type DynamicModule, Global, Module, type Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { InMemoryEventChannel } from './channels/in-memory/in-memory-event.channel';
import { KAFKA_EVENT_CHANNEL_OPTIONS, KafkaEventChannel } from './channels/kafka/kafka-event.channel';
import { RABBITMQ_EVENT_CHANNEL_OPTIONS, RabbitMQEventChannel } from './channels/rabbitmq/rabbitmq-event.channel';
import { REDIS_EVENT_CHANNEL_OPTIONS, RedisEventChannel } from './channels/redis/redis-event.channel';
import { EVENT_CHANNELS, EVENT_PUBLISHER_MODULE_OPTIONS, type EventPublisherModuleOptions, type IEventChannel } from './event-publisher.interface';
import { EventPublisher } from './event-publisher.service';

@Global()
@Module({})
export class EventPublisherModule {
  static forRoot(options?: EventPublisherModuleOptions): DynamicModule {
    const useInMemory = options?.inMemory ?? true;
    const useRedis = Boolean(options?.redis);
    const useKafka = Boolean(options?.kafka);
    const useRabbitMQ = Boolean(options?.rabbitmq);

    const activeChannels = [
      ...(useInMemory ? [InMemoryEventChannel] : []),
      ...(useRedis ? [RedisEventChannel] : []),
      ...(useKafka ? [KafkaEventChannel] : []),
      ...(useRabbitMQ ? [RabbitMQEventChannel] : []),
    ];

    const extraProviders: Provider[] = [
      {
        provide: EVENT_PUBLISHER_MODULE_OPTIONS,
        useValue: options ?? {},
      },
      ...(useRedis && options?.redis
        ? [{ provide: REDIS_EVENT_CHANNEL_OPTIONS, useValue: options.redis }]
        : []),
      ...(useKafka && options?.kafka
        ? [{ provide: KAFKA_EVENT_CHANNEL_OPTIONS, useValue: options.kafka }]
        : []),
      ...(useRabbitMQ && options?.rabbitmq
        ? [{ provide: RABBITMQ_EVENT_CHANNEL_OPTIONS, useValue: options.rabbitmq }]
        : []),
    ];

    return {
      module: EventPublisherModule,
      imports: [CqrsModule],
      providers: [
        ...activeChannels,
        ...extraProviders,
        {
          provide: EVENT_CHANNELS,
          useFactory: (...instances: IEventChannel[]) => instances,
          inject: activeChannels,
        },
        EventPublisher,
      ],
      exports: [EventPublisher],
    };
  }
}
