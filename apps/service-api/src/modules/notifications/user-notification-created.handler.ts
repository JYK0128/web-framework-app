import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { BrokerConsumer } from '@pkg/server-core/event-broker/broker-consumer.decorator';
import { UserNotificationCreatedEvent } from '@pkg/shared/server';

import { NotificationStreamService } from '#/modules/notifications/notification-stream.service';

@EventsHandler(UserNotificationCreatedEvent)
@BrokerConsumer()
export class UserNotificationCreatedHandler implements IEventHandler<UserNotificationCreatedEvent> {
  constructor(
    private readonly notificationStream: NotificationStreamService,
  ) {}

  handle(event: UserNotificationCreatedEvent): void {
    this.notificationStream.publish(event);
  }
}
