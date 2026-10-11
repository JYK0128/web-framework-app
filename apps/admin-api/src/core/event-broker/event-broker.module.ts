import { type DynamicModule, HttpStatus, Module, type Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { InMemoryAdapter } from './adapters/in-memory.adapter';
import { KAFKA_ADAPTER_OPTIONS, KafkaAdapter } from './adapters/kafka.adapter';
import { RABBITMQ_ADAPTER_OPTIONS, RabbitMQAdapter } from './adapters/rabbitmq.adapter';
import { REDIS_PUBSUB_ADAPTER_OPTIONS, RedisPubSubAdapter } from './adapters/redis-pubsub.adapter';
import { REDIS_STREAMS_ADAPTER_OPTIONS, RedisStreamsAdapter } from './adapters/redis-streams.adapter';
import { type BrokerAdapter, EVENT_BROKER, type EventBrokerModuleOptions } from './event-broker.interface';
import { EventBroker } from './event-broker.service';

@Module({})
export class EventBrokerModule {
  static forRoot(options: EventBrokerModuleOptions = {}): DynamicModule {
    const useRedisPubSub = Boolean(options.redisPubSub);
    const useRedisStreams = Boolean(options.redisStreams);
    const useKafka = Boolean(options.kafka);
    const useRabbitMQ = Boolean(options.rabbitmq);

    const registrations = [
      { name: 'in-memory', adapter: InMemoryAdapter, token: EVENT_BROKER.IN_MEMORY },
      ...(useRedisPubSub ? [{ name: 'redis-pubsub', adapter: RedisPubSubAdapter, token: EVENT_BROKER.REDIS_PUBSUB }] : []),
      ...(useRedisStreams ? [{ name: 'redis-streams', adapter: RedisStreamsAdapter, token: EVENT_BROKER.REDIS_STREAMS }] : []),
      ...(useKafka ? [{ name: 'kafka', adapter: KafkaAdapter, token: EVENT_BROKER.KAFKA }] : []),
      ...(useRabbitMQ ? [{ name: 'rabbitmq', adapter: RabbitMQAdapter, token: EVENT_BROKER.RABBITMQ }] : []),
    ];
    const defaultName = options.defaultAdapter ?? 'in-memory';
    const defaultRegistration = registrations.find(({ name }) => name === defaultName);
    if (!defaultRegistration) throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: HttpStatus.INTERNAL_SERVER_ERROR });

    const brokerProviders: Provider[] = registrations.map(({ adapter, token }) => ({
      provide: token,
      useFactory: (instance: BrokerAdapter) => new EventBroker(instance),
      inject: [adapter],
    }));

    const extraProviders: Provider[] = [
      ...(useRedisPubSub && options.redisPubSub
        ? [{ provide: REDIS_PUBSUB_ADAPTER_OPTIONS, useValue: options.redisPubSub }]
        : []),
      ...(useRedisStreams && options.redisStreams
        ? [{ provide: REDIS_STREAMS_ADAPTER_OPTIONS, useValue: options.redisStreams }]
        : []),
      ...(useKafka && options.kafka
        ? [{ provide: KAFKA_ADAPTER_OPTIONS, useValue: options.kafka }]
        : []),
      ...(useRabbitMQ && options.rabbitmq
        ? [{ provide: RABBITMQ_ADAPTER_OPTIONS, useValue: options.rabbitmq }]
        : []),
    ];

    return {
      module: EventBrokerModule,
      global: true,
      imports: [CqrsModule],
      providers: [
        ...registrations.map(({ adapter }) => adapter),
        ...extraProviders,
        ...brokerProviders,
        { provide: EventBroker, useExisting: defaultRegistration.token },
      ],
      exports: [EventBroker, ...registrations.map(({ token }) => token)],
    };
  }
}
