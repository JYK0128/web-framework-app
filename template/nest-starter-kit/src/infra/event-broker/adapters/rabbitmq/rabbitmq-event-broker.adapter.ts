import { Inject, Injectable } from '@nestjs/common';
import type { IEvent } from '@nestjs/cqrs';

import type { IEventBrokerAdapter } from '#/infra/event-broker/event-broker.interface';

export interface RabbitMQEventBrokerAdapterOptions {
  url: string
  exchange?: string
  durable?: boolean
}

export const RABBITMQ_EVENT_BROKER_ADAPTER_OPTIONS = Symbol('RABBITMQ_EVENT_BROKER_ADAPTER_OPTIONS');

/**
 * @stub Replace with a real AMQP client (e.g. amqplib / @golevelup/nestjs-rabbitmq) before going to production.
 */
@Injectable()
export class RabbitMQEventBrokerAdapter implements IEventBrokerAdapter {
  readonly name = 'rabbitmq';

  constructor(
    @Inject(RABBITMQ_EVENT_BROKER_ADAPTER_OPTIONS)
    private readonly options: RabbitMQEventBrokerAdapterOptions,
  ) {}

  async publish<T extends IEvent>(_event: T): Promise<void> {}
}
