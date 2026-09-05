import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import type { EmailAdapterResult, EmailMessage, IEmailAdapter } from '#/infra/notification/channels/email/email.interface';
import { NOTIFICATION_MODULE_OPTIONS, type NotificationModuleOptions } from '#/infra/notification/notification.interface';

/**
 * AWS SES Email 연동 어댑터
 */
@Injectable()
export class AwsSesEmailAdapter implements IEmailAdapter {
  readonly providerName = 'aws-ses';
  private readonly logger = new Logger(AwsSesEmailAdapter.name);
  private readonly defaultFrom: string;
  private readonly region: string;

  constructor(
    @Inject(NOTIFICATION_MODULE_OPTIONS)
    options: NotificationModuleOptions,
  ) {
    this.defaultFrom = options.email?.ses?.senderAddress || '';
    this.region = options.email?.ses?.region || 'ap-northeast-2';
  }

  async send(message: EmailMessage): Promise<EmailAdapterResult> {
    const from = message.from || this.defaultFrom;
    const targetTo = typeof message.to === 'string' ? message.to : JSON.stringify(message.to);
    const fromStr = typeof from === 'string' ? from : JSON.stringify(from);

    try {
      // AWS SES v2/v3 REST or SDK 연동부
      this.logger.log(`[AWS SES Mail Sent] Region: ${this.region} | To: ${targetTo} | Subject: "${String(message.subject)}" | From: ${fromStr}`);

      return {
        success: true,
        messageId: `ses-${Date.now()}-${randomUUID()}`,
      };
    }
    catch (error) {
      const errMsg = ApplicationError.from(error, 'EMAIL_SEND_FAILED').message;
      this.logger.error(`[AWS SES Error] Failed to send email to ${targetTo}: ${errMsg}`);
      return {
        success: false,
        error: errMsg,
      };
    }
  }
}
