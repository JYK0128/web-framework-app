import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { NotificationStreamService } from '#/modules/notifications/notification-stream.service';
import { NotificationsController } from '#/modules/notifications/notifications.controller';
import { UserNotificationCreatedHandler } from '#/modules/notifications/user-notification-created.handler';

@Module({
  imports: [CqrsModule],
  controllers: [NotificationsController],
  providers: [NotificationStreamService, UserNotificationCreatedHandler],
  exports: [NotificationStreamService],
})
export class NotificationsModule {}
