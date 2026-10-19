import { Global, Module } from '@nestjs/common';

import { SmtpAdapter } from './channels/email/smtp.adapter';
import { MessengerAdapter } from './channels/messenger/messenger.adapter';
import { PushAdapter } from './channels/push/push.adapter';
import { SmsAdapter } from './channels/sms/sms.adapter';
import { HttpWebhookAdapter } from './channels/webhook/webhook.adapter';

@Global()
@Module({
  providers: [SmtpAdapter, SmsAdapter, PushAdapter, MessengerAdapter, HttpWebhookAdapter],
  exports: [SmtpAdapter, SmsAdapter, PushAdapter, MessengerAdapter, HttpWebhookAdapter],
})
export class DeliveryModule {}
