import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateOwnSupportMessageHandler } from '#/modules/support/messages/create-own-support-message.handler';
import { CreateSupportMessageHandler } from '#/modules/support/messages/create-support-message.handler';
import { GetOwnSupportMessagesHandler } from '#/modules/support/messages/get-own-support-messages.handler';
import { GetSupportMessagesHandler } from '#/modules/support/messages/get-support-messages.handler';
import { SupportMessagesController } from '#/modules/support/messages/messages.controller';
import { SupportInternalMessagesController } from '#/modules/support/messages/messages-internal.controller';
import { SupportRoomsModule } from '#/modules/support/rooms/rooms.module';
import { SystemConfigsModule } from '#/modules/system-configs/system-configs.module';

@Module({
  imports: [CqrsModule, SupportRoomsModule, SystemConfigsModule],
  controllers: [SupportMessagesController, SupportInternalMessagesController],
  providers: [GetOwnSupportMessagesHandler, CreateOwnSupportMessageHandler, GetSupportMessagesHandler, CreateSupportMessageHandler],
})
export class SupportMessagesModule {}
