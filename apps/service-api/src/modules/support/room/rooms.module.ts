import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateSupportRoomHandler } from '~/modules/support/room/create-support-room.handler';
import { GetOwnSupportRoomHandler } from '~/modules/support/room/get-own-support-room.handler';
import { GetOwnSupportRoomsHandler } from '~/modules/support/room/get-own-support-rooms.handler';
import { GetSupportRoomHandler } from '~/modules/support/room/get-support-room.handler';
import { GetSupportRoomsHandler } from '~/modules/support/room/get-support-rooms.handler';
import { GetUserSupportRoomHandler } from '~/modules/support/room/get-user-support-room.handler';
import { SupportRoomsController } from '~/modules/support/room/rooms.controller';
import { SupportInternalRoomsController } from '~/modules/support/room/rooms-internal.controller';
import { UpdateOwnSupportRoomHandler } from '~/modules/support/room/update-own-support-room.handler';
import { UpdateSupportRoomHandler } from '~/modules/support/room/update-support-room.handler';
import { SystemConfigsModule } from '~/modules/system-config/system-configs.module';

@Module({
  imports: [CqrsModule, SystemConfigsModule],
  controllers: [SupportRoomsController, SupportInternalRoomsController],
  providers: [UpdateOwnSupportRoomHandler, GetSupportRoomsHandler, GetOwnSupportRoomsHandler, GetSupportRoomHandler, GetOwnSupportRoomHandler, GetUserSupportRoomHandler, CreateSupportRoomHandler, UpdateSupportRoomHandler],
})
export class SupportRoomsModule {}
