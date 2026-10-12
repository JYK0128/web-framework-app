import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigDeliveryController } from './delivery.controller';
import { TestEmailHandler } from './test-email.handler';
import { TestMessengerHandler } from './test-messenger.handler';
import { TestPushHandler } from './test-push.handler';
import { TestSmsHandler } from './test-sms.handler';

@Module({ imports: [CqrsModule], controllers: [SystemConfigDeliveryController], providers: [TestEmailHandler, TestSmsHandler, TestPushHandler, TestMessengerHandler] })
export class SystemConfigDeliveryModule {}
