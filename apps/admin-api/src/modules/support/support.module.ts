import { Module } from '@nestjs/common';

import { SupportMessagesModule } from '~/modules/support/message/messages.module';
import { SupportRoomsModule } from '~/modules/support/room/rooms.module';
import { SupportGateway } from '~/modules/support/support.gateway';

@Module({ imports: [SupportRoomsModule, SupportMessagesModule], providers: [SupportGateway] })
export class SupportModule {}
