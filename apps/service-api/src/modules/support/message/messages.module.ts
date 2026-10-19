import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateOwnSupportMessageHandler } from '#/modules/support/message/create-own-support-message.handler';
import { CreateSupportMessageHandler } from '#/modules/support/message/create-support-message.handler';
import { GetOwnSupportMessagesHandler } from '#/modules/support/message/get-own-support-messages.handler';
import { GetSupportMessagesHandler } from '#/modules/support/message/get-support-messages.handler';
import { SupportMessagesController } from '#/modules/support/message/messages.controller';
import { SupportInternalMessagesController } from '#/modules/support/message/messages-internal.controller';
import { SupportRoomsModule } from '#/modules/support/room/rooms.module';
import { SystemConfigsModule } from '#/modules/system-config/system-configs.module';

@Module({
  imports: [CqrsModule, SupportRoomsModule, SystemConfigsModule],
  controllers: [SupportMessagesController, SupportInternalMessagesController],
  providers: [GetOwnSupportMessagesHandler, CreateOwnSupportMessageHandler, GetSupportMessagesHandler, CreateSupportMessageHandler],
})
export class SupportMessagesModule {}
