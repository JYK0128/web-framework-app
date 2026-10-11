import { type DynamicModule, HttpStatus, Module, type Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { InMemoryEventBrokerAdapter } from './adapters/in-memory/in-memory-event-broker.adapter';
import { KAFKA_EVENT_BROKER_ADAPTER_OPTIONS, KafkaEventBrokerAdapter } from './adapters/kafka/kafka-event-broker.adapter';
import { RABBITMQ_EVENT_BROKER_ADAPTER_OPTIONS, RabbitMQEventBrokerAdapter } from './adapters/rabbitmq/rabbitmq-event-broker.adapter';
import { REDIS_PUBSUB_EVENT_BROKER_ADAPTER_OPTIONS, RedisPubSubEventBrokerAdapter } from './adapters/redis-pubsub/redis-pubsub-event-broker.adapter';
import { REDIS_STREAMS_EVENT_BROKER_ADAPTER_OPTIONS, RedisStreamsEventBrokerAdapter } from './adapters/redis-streams/redis-streams-event-broker.adapter';
import { EVENT_BROKER, type EventBrokerModuleOptions, type IEventBrokerAdapter } from './event-broker.interface';
import { EventBroker } from './event-broker.service';

@Module({})
export class EventBrokerModule {
  static forRoot(options: EventBrokerModuleOptions = {}): DynamicModule {
    const useRedisPubSub = Boolean(options.redisPubSub);
    const useRedisStreams = Boolean(options.redisStreams);
    const useKafka = Boolean(options.kafka);
    const useRabbitMQ = Boolean(options.rabbitmq);

    const registrations = [
      { name: 'in-memory', adapter: InMemoryEventBrokerAdapter, token: EVENT_BROKER.IN_MEMORY },
      ...(useRedisPubSub ? [{ name: 'redis-pubsub', adapter: RedisPubSubEventBrokerAdapter, token: EVENT_BROKER.REDIS_PUBSUB }] : []),
      ...(useRedisStreams ? [{ name: 'redis-streams', adapter: RedisStreamsEventBrokerAdapter, token: EVENT_BROKER.REDIS_STREAMS }] : []),
      ...(useKafka ? [{ name: 'kafka', adapter: KafkaEventBrokerAdapter, token: EVENT_BROKER.KAFKA }] : []),
      ...(useRabbitMQ ? [{ name: 'rabbitmq', adapter: RabbitMQEventBrokerAdapter, token: EVENT_BROKER.RABBITMQ }] : []),
    ];
    const defaultName = options.defaultAdapter ?? 'in-memory';
    const defaultRegistration = registrations.find(({ name }) => name === defaultName);
    if (!defaultRegistration) throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: HttpStatus.INTERNAL_SERVER_ERROR });

    const brokerProviders: Provider[] = registrations.map(({ adapter, token }) => ({
      provide: token,
      useFactory: (instance: IEventBrokerAdapter) => new EventBroker(instance),
      inject: [adapter],
    }));

    const extraProviders: Provider[] = [
      ...(useRedisPubSub && options.redisPubSub
        ? [{ provide: REDIS_PUBSUB_EVENT_BROKER_ADAPTER_OPTIONS, useValue: options.redisPubSub }]
        : []),
      ...(useRedisStreams && options.redisStreams
        ? [{ provide: REDIS_STREAMS_EVENT_BROKER_ADAPTER_OPTIONS, useValue: options.redisStreams }]
        : []),
      ...(useKafka && options.kafka
        ? [{ provide: KAFKA_EVENT_BROKER_ADAPTER_OPTIONS, useValue: options.kafka }]
        : []),
      ...(useRabbitMQ && options.rabbitmq
        ? [{ provide: RABBITMQ_EVENT_BROKER_ADAPTER_OPTIONS, useValue: options.rabbitmq }]
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
