import { Module } from '@nestjs/common';

import { SupportMessagesController } from '#/modules/support/messages/messages.controller';

@Module({ controllers: [SupportMessagesController] })
export class SupportMessagesModule {}
