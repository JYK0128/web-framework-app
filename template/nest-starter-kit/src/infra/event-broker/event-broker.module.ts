import { type DynamicModule, Global, Module, type Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { InMemoryEventBrokerAdapter } from './adapters/in-memory/in-memory-event-broker.adapter';
import { KAFKA_EVENT_BROKER_ADAPTER_OPTIONS, KafkaEventBrokerAdapter } from './adapters/kafka/kafka-event-broker.adapter';
import { RABBITMQ_EVENT_BROKER_ADAPTER_OPTIONS, RabbitMQEventBrokerAdapter } from './adapters/rabbitmq/rabbitmq-event-broker.adapter';
import { REDIS_EVENT_BROKER_ADAPTER_OPTIONS, RedisEventBrokerAdapter } from './adapters/redis/redis-event-broker.adapter';
import { EVENT_BROKER_ADAPTERS, EVENT_BROKER_MODULE_OPTIONS, type EventBrokerModuleOptions, type IEventBrokerAdapter } from './event-broker.interface';
import { EventBroker } from './event-broker.service';

@Global()
@Module({})
export class EventBrokerModule {
  static forRoot(options?: EventBrokerModuleOptions): DynamicModule {
    const useInMemory = options?.inMemory ?? true;
    const useRedis = Boolean(options?.redis);
    const useKafka = Boolean(options?.kafka);
    const useRabbitMQ = Boolean(options?.rabbitmq);

    const activeAdapters = [
      ...(useInMemory ? [InMemoryEventBrokerAdapter] : []),
      ...(useRedis ? [RedisEventBrokerAdapter] : []),
      ...(useKafka ? [KafkaEventBrokerAdapter] : []),
      ...(useRabbitMQ ? [RabbitMQEventBrokerAdapter] : []),
    ];

    const extraProviders: Provider[] = [
      {
        provide: EVENT_BROKER_MODULE_OPTIONS,
        useValue: options ?? {},
      },
      ...(useRedis && options?.redis
        ? [{ provide: REDIS_EVENT_BROKER_ADAPTER_OPTIONS, useValue: options.redis }]
        : []),
      ...(useKafka && options?.kafka
        ? [{ provide: KAFKA_EVENT_BROKER_ADAPTER_OPTIONS, useValue: options.kafka }]
        : []),
      ...(useRabbitMQ && options?.rabbitmq
        ? [{ provide: RABBITMQ_EVENT_BROKER_ADAPTER_OPTIONS, useValue: options.rabbitmq }]
        : []),
    ];

    return {
      module: EventBrokerModule,
      imports: [CqrsModule],
      providers: [
        ...activeAdapters,
        ...extraProviders,
        {
          provide: EVENT_BROKER_ADAPTERS,
          useFactory: (...instances: IEventBrokerAdapter[]) => instances,
          inject: activeAdapters,
        },
        EventBroker,
      ],
      exports: [EventBroker],
    };
  }
}
