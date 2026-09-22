import { Global, Module } from '@nestjs/common';

import { SmtpAdapter } from './channels/email/smtp.adapter';
import { HttpWebhookAdapter } from './channels/webhook/webhook.adapter';
import { NotificationService } from './notification.service';
import { ProviderNotificationService } from './provider-notification.service';

@Global()
@Module({
  providers: [SmtpAdapter, HttpWebhookAdapter, ProviderNotificationService, NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
