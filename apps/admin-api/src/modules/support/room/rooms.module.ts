import { Module } from '@nestjs/common';

import { SupportRoomsController } from '#/modules/support/room/rooms.controller';

@Module({ controllers: [SupportRoomsController] })
export class SupportRoomsModule {}
