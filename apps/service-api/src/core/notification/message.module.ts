import { Global, Module } from '@nestjs/common';

import { SmtpAdapter } from './adapters/email/smtp.adapter';
import { AlimtalkAdapter } from './adapters/messenger/alimtalk.adapter';
import { MessengerAdapter } from './adapters/messenger/messenger.adapter';
import { PushAdapter } from './adapters/push/push.adapter';
import { SmsAdapter } from './adapters/sms/sms.adapter';
import { WebhookAdapter } from './adapters/webhook/webhook.adapter';
import { MessageService } from './message.service';
import { MessageTemplateService } from './message-template.service';

@Global()
@Module({
  providers: [AlimtalkAdapter, SmtpAdapter, SmsAdapter, PushAdapter, MessengerAdapter, WebhookAdapter, MessageService, MessageTemplateService],
  exports: [MessageService, MessageTemplateService],
})
export class MessageModule {}
