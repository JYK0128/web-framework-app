import { Module } from '@nestjs/common';

import { SupportMessagesModule } from '#/modules/support/message/messages.module';
import { SupportNotificationModule } from '#/modules/support/notification/notification.module';
import { SupportRealtimeModule } from '#/modules/support/realtime/realtime.module';
import { SupportRoomsModule } from '#/modules/support/room/rooms.module';

@Module({
  imports: [SupportRoomsModule, SupportMessagesModule, SupportRealtimeModule, SupportNotificationModule],
  exports: [SupportNotificationModule],
})
export class SupportModule {}
