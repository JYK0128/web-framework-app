import { Global, Module } from '@nestjs/common';

import { AlimtalkAdapter } from './adapters/alimtalk.adapter';
import { MessengerAdapter } from './adapters/messenger.adapter';
import { PushAdapter } from './adapters/push.adapter';
import { SmsAdapter } from './adapters/sms.adapter';
import { SmtpAdapter } from './adapters/smtp.adapter';
import { NotificationService } from './notification.service';

@Global()
@Module({
  providers: [AlimtalkAdapter, SmtpAdapter, SmsAdapter, PushAdapter, MessengerAdapter, NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
