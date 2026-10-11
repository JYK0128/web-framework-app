import { HttpStatus, Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { IEvent } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { type Consumer, Kafka, type Producer, type SASLOptions } from 'kafkajs';

import type { EventBrokerConsumerOptions, EventBrokerListener, IEventBrokerAdapter } from '#/core/event-broker/event-broker.interface';

export interface KafkaEventBrokerAdapterOptions {
  brokers: string[]
  clientId?: string
  topic?: string
  ssl?: boolean
  sasl?: SASLOptions
}

export const KAFKA_EVENT_BROKER_ADAPTER_OPTIONS = Symbol('KAFKA_EVENT_BROKER_ADAPTER_OPTIONS');

@Injectable()
export class KafkaEventBrokerAdapter implements IEventBrokerAdapter, OnModuleInit, OnModuleDestroy {
  readonly name = 'kafka';
  private readonly logger = new Logger(KafkaEventBrokerAdapter.name);
  private kafka?: Kafka;
  private producer?: Producer;
  private readonly consumers = new Set<Consumer>();

  constructor(@Inject(KAFKA_EVENT_BROKER_ADAPTER_OPTIONS) private readonly options: KafkaEventBrokerAdapterOptions) {}

  async onModuleInit(): Promise<void> {
    this.kafka = new Kafka({ ...this.options, clientId: this.options.clientId ?? 'event-broker' });
    this.producer = this.kafka.producer();
    await this.producer.connect();
  }

  async publish<T extends IEvent>(event: T): Promise<void> {
    if (!this.producer) throw new ApplicationError({ code: 'INTERNAL_SERVICE_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
    await this.producer.send({ topic: `${this.options.topic ?? 'events'}.${event.constructor.name}`, acks: -1, messages: [{ value: JSON.stringify(event) }] });
  }

  async subscribe(eventName: string, listener: EventBrokerListener, options?: EventBrokerConsumerOptions): Promise<() => Promise<void>> {
    if (!options?.group) throw new ApplicationError({ code: 'BAD_REQUEST', status: HttpStatus.BAD_REQUEST });
    if (!this.kafka) throw new ApplicationError({ code: 'INTERNAL_SERVICE_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
    const consumer = this.kafka.consumer({ groupId: `${options.group}.${eventName}` });
    this.consumers.add(consumer);
    try {
      await consumer.connect();
      await consumer.subscribe({ topic: `${this.options.topic ?? 'events'}.${eventName}`, fromBeginning: true });
      await consumer.run({
        autoCommit: false,
        eachMessage: async (context) => {
          const { topic, partition, message } = context;
          if (!message.value) throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: HttpStatus.INTERNAL_SERVER_ERROR });
          const payload: unknown = JSON.parse(message.value.toString());
          await listener(payload);
          await context.heartbeat();
          await consumer.commitOffsets([{ topic, partition, offset: (BigInt(message.offset) + 1n).toString() }]);
        },
      });
    }
    catch (error) {
      this.consumers.delete(consumer);
      try {
        await consumer.disconnect();
      }
      catch (cleanupError) {
        this.logger.error(`Kafka consumer cleanup failed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
      }
      throw error;
    }
    return async () => {
      if (this.consumers.delete(consumer)) await consumer.disconnect();
    };
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.consumers].map((consumer) => consumer.disconnect()));
    this.consumers.clear();
    await this.producer?.disconnect();
    this.producer = undefined;
    this.kafka = undefined;
  }
}
