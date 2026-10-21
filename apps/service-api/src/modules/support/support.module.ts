import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SupportMessagesModule } from '~/modules/support/message/messages.module';
import { SupportNotificationModule } from '~/modules/support/notification/notification.module';
import { SupportRoomsModule } from '~/modules/support/room/rooms.module';
import { SupportGateway } from '~/modules/support/support.gateway';

@Module({
  imports: [CqrsModule, SupportRoomsModule, SupportMessagesModule, SupportNotificationModule],
  providers: [SupportGateway],
  exports: [SupportNotificationModule],
})
export class SupportModule {}
