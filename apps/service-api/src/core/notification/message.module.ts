import { Global, Module } from '@nestjs/common';

import { AlimtalkAdapter } from './adapters/alimtalk.adapter';
import { MessengerAdapter } from './adapters/messenger.adapter';
import { PushAdapter } from './adapters/push.adapter';
import { SmsAdapter } from './adapters/sms.adapter';
import { SmtpAdapter } from './adapters/smtp.adapter';
import { WebhookAdapter } from './adapters/webhook.adapter';
import { MessageService } from './message.service';
import { MessageTemplateService } from './message-template.service';

@Global()
@Module({
  providers: [AlimtalkAdapter, SmtpAdapter, SmsAdapter, PushAdapter, MessengerAdapter, WebhookAdapter, MessageService, MessageTemplateService],
  exports: [MessageService, MessageTemplateService],
})
export class MessageModule {}
