import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { BrokerConsumer } from '@pkg/server-core/event-broker/broker-consumer.decorator';
import { UserNotificationCreatedEvent } from '@pkg/server-core/event-broker/events';

import { NotificationStreamService } from '#/modules/notification/notification-stream.service';

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
