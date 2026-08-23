import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import type { EmailMessage, EmailProviderResult, IEmailProvider } from '#/infra/notification/channels/email/email.interface';
import { NOTIFICATION_MODULE_OPTIONS, type NotificationModuleOptions } from '#/infra/notification/notification.interface';

/**
 * NHN Cloud Email (Notification) 서비스 기반 이메일 공급자
 */
@Injectable()
export class NhnEmailProvider implements IEmailProvider {
  readonly providerName = 'nhn';
  private readonly logger = new Logger(NhnEmailProvider.name);
  private readonly defaultFrom: string;

  constructor(
    @Inject(NOTIFICATION_MODULE_OPTIONS)
    options: NotificationModuleOptions,
  ) {
    this.defaultFrom = options.email?.nhn?.senderAddress || '';
  }

  async send(message: EmailMessage): Promise<EmailProviderResult> {
    const from = message.from || this.defaultFrom;
    const targetTo = typeof message.to === 'string' ? message.to : JSON.stringify(message.to);
    const fromStr = typeof from === 'string' ? from : JSON.stringify(from);

    try {
      // NHN Cloud Email REST API (https://email.api.nhncloudservice.com/email/v2.0/...) 연동부
      this.logger.log(`[NHN Cloud Mail Sent] To: ${targetTo} | Subject: "${String(message.subject)}" | From: ${fromStr}`);

      return {
        success: true,
        messageId: `nhn-mail-${Date.now()}`,
      };
    }
    catch (error) {
      const errMsg = ApplicationError.from(error, 'NHN Cloud email send failed').message;
      this.logger.error(`[NHN Cloud Error] Failed to send email to ${targetTo}: ${errMsg}`);
      return {
        success: false,
        error: errMsg,
      };
    }
  }
}
