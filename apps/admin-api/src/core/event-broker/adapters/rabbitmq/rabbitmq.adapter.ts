import { HttpStatus, Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { IEvent } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { type Channel, type ChannelModel, type ConfirmChannel, connect } from 'amqplib';

import type { BrokerConsumerOptions, BrokerListener, BrokerAdapter } from '#/core/event-broker/event-broker.interface';

export interface RabbitMQAdapterOptions {
  url: string
  exchange?: string
  durable?: boolean
}

export const RABBITMQ_ADAPTER_OPTIONS = Symbol('RABBITMQ_ADAPTER_OPTIONS');

@Injectable()
export class RabbitMQAdapter implements BrokerAdapter, OnModuleInit, OnModuleDestroy {
  readonly name = 'rabbitmq';
  private readonly logger = new Logger(RabbitMQAdapter.name);
  private connection?: ChannelModel;
  private publisher?: ConfirmChannel;
  private readonly subscriptions = new Set<Channel>();

  constructor(@Inject(RABBITMQ_ADAPTER_OPTIONS) private readonly options: RabbitMQAdapterOptions) {}

  async onModuleInit(): Promise<void> {
    this.connection = await connect(this.options.url);
    this.connection.on('error', (error: Error) => this.logger.error(error.message));
    this.publisher = await this.connection.createConfirmChannel();
    this.publisher.on('error', (error: Error) => this.logger.error(error.message));
    await this.publisher.assertExchange(this.options.exchange ?? 'events', 'topic', { durable: this.options.durable ?? true });
  }

  async publish<T extends IEvent>(event: T): Promise<void> {
    const publisher = this.publisher;
    if (!publisher) throw new ApplicationError({ code: 'INTERNAL_SERVICE_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
    await new Promise<void>((resolve, reject) => {
      publisher.publish(this.options.exchange ?? 'events', event.constructor.name, Buffer.from(JSON.stringify(event)), { persistent: this.options.durable ?? true, contentType: 'application/json' }, (error: unknown) => {
        if (error) reject(ApplicationError.from(error, { code: 'INTERNAL_SERVICE_CALL_FAILED', status: HttpStatus.BAD_GATEWAY }));
        else resolve();
      });
    });
  }

  async subscribe(eventName: string, listener: BrokerListener, options?: BrokerConsumerOptions): Promise<() => Promise<void>> {
    if (!options?.group) throw new ApplicationError({ code: 'BAD_REQUEST', status: HttpStatus.BAD_REQUEST });
    if (!this.connection) throw new ApplicationError({ code: 'INTERNAL_SERVICE_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });
    const channel = await this.connection.createChannel();
    channel.on('error', (error: Error) => this.logger.error(error.message));
    this.subscriptions.add(channel);
    try {
      const queue = await channel.assertQueue(`${options.group}.${eventName}`, { durable: this.options.durable ?? true });
      await channel.bindQueue(queue.queue, this.options.exchange ?? 'events', eventName);
      await channel.prefetch(1);
      await channel.consume(queue.queue, (message) => {
        if (!message) return;
        void (async () => {
          try {
            const payload: unknown = JSON.parse(message.content.toString());
            await listener(payload);
            channel.ack(message);
          }
          catch (error) {
            this.logger.error(`RabbitMQ event ${eventName} failed: ${String(error)}`);
            channel.nack(message, false, true);
          }
        })().catch((error: unknown) => this.logger.error(`RabbitMQ acknowledgement failed: ${String(error)}`));
      }, { noAck: false });
    }
    catch (error) {
      this.subscriptions.delete(channel);
      try {
        await channel.close();
      }
      catch (cleanupError) {
        this.logger.error(`RabbitMQ channel cleanup failed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
      }
      throw error;
    }
    return async () => {
      if (this.subscriptions.delete(channel)) await channel.close();
    };
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.subscriptions].map((channel) => channel.close()));
    this.subscriptions.clear();
    await this.publisher?.close();
    await this.connection?.close();
    this.publisher = undefined;
    this.connection = undefined;
  }
}
