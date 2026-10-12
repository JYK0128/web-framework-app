import { Module } from '@nestjs/common';

import { NotificationStreamService } from './notification-stream.service';
import { NotificationsController } from './notifications.controller';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationStreamService],
  exports: [NotificationStreamService],
})
export class NotificationsModule {}
