import { Module } from '@nestjs/common';

import { SupportMessagesController } from '~/modules/support/message/messages.controller';

@Module({ controllers: [SupportMessagesController] })
export class SupportMessagesModule {}
