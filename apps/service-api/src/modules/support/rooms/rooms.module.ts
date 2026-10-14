import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateSupportRoomHandler } from '#/modules/support/rooms/create-support-room.handler';
import { GetOwnSupportRoomHandler } from '#/modules/support/rooms/get-own-support-room.handler';
import { GetOwnSupportRoomsHandler } from '#/modules/support/rooms/get-own-support-rooms.handler';
import { GetSupportRoomHandler } from '#/modules/support/rooms/get-support-room.handler';
import { GetSupportRoomsHandler } from '#/modules/support/rooms/get-support-rooms.handler';
import { SupportRoomsController } from '#/modules/support/rooms/rooms.controller';
import { SupportInternalRoomsController } from '#/modules/support/rooms/rooms-internal.controller';
import { UpdateOwnSupportRoomHandler } from '#/modules/support/rooms/update-own-support-room.handler';
import { UpdateSupportRoomHandler } from '#/modules/support/rooms/update-support-room.handler';
import { SystemConfigsModule } from '#/modules/system-configs/system-configs.module';

@Module({
  imports: [CqrsModule, SystemConfigsModule],
  controllers: [SupportRoomsController, SupportInternalRoomsController],
  providers: [UpdateOwnSupportRoomHandler, GetSupportRoomsHandler, GetOwnSupportRoomsHandler, GetSupportRoomHandler, GetOwnSupportRoomHandler, CreateSupportRoomHandler, UpdateSupportRoomHandler],
})
export class SupportRoomsModule {}
