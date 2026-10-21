import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { NotificationStreamService } from '~/modules/notification/notification-stream.service';
import { NotificationsController } from '~/modules/notification/notifications.controller';
import { UserNotificationCreatedHandler } from '~/modules/notification/user-notification-created.handler';

@Module({
  imports: [CqrsModule],
  controllers: [NotificationsController],
  providers: [NotificationStreamService, UserNotificationCreatedHandler],
  exports: [NotificationStreamService],
})
export class NotificationsModule {}
