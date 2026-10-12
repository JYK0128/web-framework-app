import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigNotificationController } from './notification.controller';
import { TestEmailHandler } from './test-email.handler';
import { TestMessengerHandler } from './test-messenger.handler';
import { TestPushHandler } from './test-push.handler';
import { TestSmsHandler } from './test-sms.handler';

@Module({ imports: [CqrsModule], controllers: [SystemConfigNotificationController], providers: [TestEmailHandler, TestSmsHandler, TestPushHandler, TestMessengerHandler] })
export class SystemConfigNotificationModule {}
