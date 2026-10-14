import { Module } from '@nestjs/common';

import { SupportMessagesModule } from '#/modules/support/messages/messages.module';
import { SupportRoomsModule } from '#/modules/support/rooms/rooms.module';
import { SupportGateway } from '#/modules/support/support.gateway';

@Module({ imports: [SupportRoomsModule, SupportMessagesModule], providers: [SupportGateway] })
export class SupportModule {}
