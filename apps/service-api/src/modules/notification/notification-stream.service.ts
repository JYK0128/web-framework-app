import { Injectable } from '@nestjs/common';
import { UserNotificationCreatedEvent } from '@pkg/server-core/event-broker/events';
import { RealtimeService } from '@pkg/server-core/realtime/realtime.service';

@Injectable()
export class NotificationStreamService {
  constructor(private readonly realtime: RealtimeService) {}

  publish(event: UserNotificationCreatedEvent): void {
    this.realtime.publishSSE(this.topic(event.userId), {
      type: 'notification.created',
      data: event.notification,
    });
  }

  stream(userId: string) {
    return this.realtime.streamSSE(this.topic(userId));
  }

  private topic(userId: string): string {
    return `notification:user:${userId}`;
  }
}
