import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { UserNotificationCreatedEvent } from '@pkg/shared/server';

import { EventBroker } from '#/core/event-broker/event-broker.service';
import { RealtimeService } from '#/core/realtime/realtime.service';

@Injectable()
export class NotificationStreamService implements OnModuleInit, OnModuleDestroy {
  private unsubscribe?: () => Promise<void>;

  constructor(
    private readonly eventBroker: EventBroker,
    private readonly realtime: RealtimeService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.unsubscribe = await this.eventBroker.subscribe<UserNotificationCreatedEvent>(
      UserNotificationCreatedEvent.name,
      (event) => {
        this.realtime.publishSSE(this.topic(event.userId), {
          type: 'notification.created',
          data: event.notification,
        });
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.unsubscribe?.();
  }

  stream(userId: string) {
    return this.realtime.streamSSE(this.topic(userId));
  }

  private topic(userId: string): string {
    return `notification:user:${userId}`;
  }
}
