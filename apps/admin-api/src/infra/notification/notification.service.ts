import { Injectable } from '@nestjs/common';

import type { MessengerConfigDto, PushConfigDto, SmsConfigDto } from '#/modules/system-config/dto/notification-config.dto';

import { SmtpAdapter } from './channels/email/smtp.adapter';
import { HttpWebhookAdapter } from './channels/webhook/webhook.adapter';
import type { EmailMessage, MessengerMessage, NotificationResult, PushMessage, SmsMessage, WebhookMessage } from './notification.interface';
import { ProviderNotificationService } from './provider-notification.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly smtpAdapter: SmtpAdapter,
    private readonly webhookAdapter: HttpWebhookAdapter,
    private readonly providerNotificationService: ProviderNotificationService,
  ) {}

  sendEmail(message: EmailMessage, config: unknown): Promise<NotificationResult> {
    return this.smtpAdapter.send(message, config);
  }

  sendWebhook(message: WebhookMessage): Promise<NotificationResult> {
    return this.webhookAdapter.send(message);
  }

  sendSms(message: SmsMessage, config?: SmsConfigDto): Promise<NotificationResult> {
    return this.providerNotificationService.sendSms(message, config);
  }

  sendPush(message: PushMessage, config?: PushConfigDto): Promise<NotificationResult> {
    return this.providerNotificationService.sendPush(message, config);
  }

  sendMessenger(message: MessengerMessage, config?: MessengerConfigDto): Promise<NotificationResult> {
    return this.providerNotificationService.sendMessenger(message, config);
  }
}
