import { Module } from '@nestjs/common';

import { SupportRoomsController } from '#/modules/support/rooms/rooms.controller';

@Module({ controllers: [SupportRoomsController] })
export class SupportRoomsModule {}
