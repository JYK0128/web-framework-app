import { Global, Module } from '@nestjs/common';

import { SmtpAdapter } from './adapters/email/smtp.adapter';
import { AlimtalkAdapter } from './adapters/messenger/alimtalk.adapter';
import { MessengerAdapter } from './adapters/messenger/messenger.adapter';
import { PushAdapter } from './adapters/push/push.adapter';
import { SmsAdapter } from './adapters/sms/sms.adapter';
import { NotificationService } from './notification.service';
import { NotificationTemplateService } from './notification-template.service';

@Global()
@Module({
  providers: [AlimtalkAdapter, SmtpAdapter, SmsAdapter, PushAdapter, MessengerAdapter, NotificationService, NotificationTemplateService],
  exports: [NotificationService, NotificationTemplateService],
})
export class NotificationModule {}
