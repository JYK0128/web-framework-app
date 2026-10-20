import { Injectable } from '@nestjs/common';
import { UserNotificationCreatedEvent } from '@pkg/server-core/event-broker/events';
import { RealtimeService } from '@pkg/server-core/realtime/realtime.service';
import { ServicePermission } from '@pkg/shared';
import { filter } from 'rxjs';

@Injectable()
export class NotificationStreamService {
  constructor(private readonly realtime: RealtimeService) {}

  publish(event: UserNotificationCreatedEvent): void {
    this.realtime.publishSSE(this.topic(event.userId), {
      type: 'notification.created',
      data: event.notification,
    });
  }

  stream(userId: string, permissions: readonly string[]) {
    const canAccessSupport = permissions.includes(ServicePermission.support.read.code);
    return this.realtime.streamSSE(this.topic(userId)).pipe(
      filter(({ data }) => canAccessSupport || !isSupportNotification(data)),
    );
  }

  private topic(userId: string): string {
    return `notification:user:${userId}`;
  }
}

function isSupportNotification(data: unknown): boolean {
  return typeof data === 'object'
    && data !== null
    && 'kind' in data
    && data.kind === 'support.reply';
}
