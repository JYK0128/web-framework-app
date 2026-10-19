import { SetMetadata } from '@nestjs/common';

import type { BrokerConsumerOptions } from './event-broker.interface';

export const BROKER_CONSUMER_METADATA = Symbol('BROKER_CONSUMER_METADATA');

export interface BrokerConsumerMetadata extends BrokerConsumerOptions {
  broker?: symbol
}

export const BrokerConsumer = (options: BrokerConsumerMetadata = {}): ClassDecorator =>
  SetMetadata(BROKER_CONSUMER_METADATA, options);
