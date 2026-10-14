import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigNotificationController } from '#/modules/system-config/notification/notification.controller';
import { TestEmailHandler } from '#/modules/system-config/notification/test-email.handler';
import { TestMessengerHandler } from '#/modules/system-config/notification/test-messenger.handler';
import { TestPushHandler } from '#/modules/system-config/notification/test-push.handler';
import { TestSmsHandler } from '#/modules/system-config/notification/test-sms.handler';

@Module({ imports: [CqrsModule], controllers: [SystemConfigNotificationController], providers: [TestEmailHandler, TestSmsHandler, TestPushHandler, TestMessengerHandler] })
export class SystemConfigNotificationModule {}
