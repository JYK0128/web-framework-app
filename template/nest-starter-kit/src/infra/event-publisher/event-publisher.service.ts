import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IEvent } from '@nestjs/cqrs';

import { EVENT_CHANNELS, type IEventChannel } from './event-publisher.interface';

export interface PublishOptions {
  channel?: string
}

@Injectable()
export class EventPublisher {
  private readonly logger = new Logger(EventPublisher.name);
  private readonly channelMap = new Map<string, IEventChannel>();

  constructor(
    @Inject(EVENT_CHANNELS)
    channels: IEventChannel[],
  ) {
    for (const channel of channels) {
      this.channelMap.set(channel.name, channel);
    }
  }

  async publish<T extends IEvent>(event: T, options?: PublishOptions): Promise<void> {
    const eventName = event.constructor.name;
    const targets = this.resolveChannels(options?.channel);

    this.logger.debug(`[Event Published] ${eventName}`, {
      event,
      channels: targets.map((c) => c.name),
    });

    for (const channel of targets) {
      try {
        await channel.publish(event);
      }
      catch (error: unknown) {
        this.logger.error(`Failed to publish event ${eventName} to channel ${channel.name}:`, error);
      }
    }
  }

  async publishAll<T extends IEvent>(events: T[], options?: PublishOptions): Promise<void> {
    for (const event of events) {
      await this.publish(event, options);
    }
  }

  private resolveChannels(name?: string): IEventChannel[] {
    const target = name ?? 'in-memory';
    const channel = this.channelMap.get(target);
    if (!channel) {
      this.logger.warn(`[EventPublisher] Channel '${target}' is not registered — skipping`);
      return [];
    }
    return [channel];
  }
}
