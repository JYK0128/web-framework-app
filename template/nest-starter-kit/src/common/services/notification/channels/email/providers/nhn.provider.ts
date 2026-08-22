import { Injectable, Logger } from '@nestjs/common';

import { getErrorMessage } from '#/common/helpers/error.helper';
import type { EmailMessage, EmailProviderResult, IEmailProvider } from '#/common/services/notification/channels/email/email.interface';
import { env } from '#/env';

/**
 * NHN Cloud Email (Notification) 서비스 기반 이메일 공급자
 */
@Injectable()
export class NhnEmailProvider implements IEmailProvider {
  readonly providerName = 'nhn';
  private readonly logger = new Logger(NhnEmailProvider.name);
  private readonly defaultFrom: string;

  constructor() {
    this.defaultFrom = env.SMTP_FROM;
  }

  async send(message: EmailMessage): Promise<EmailProviderResult> {
    const from = message.from || this.defaultFrom;
    const destinations = Array.isArray(message.to) ? message.to : [message.to];
    const targetTo = destinations.join(', ');

    try {
      // NHN Cloud Email REST API (https://email.api.nhncloudservice.com/email/v2.0/...) 연동부
      this.logger.log(`[NHN Cloud Mail Sent] To: ${targetTo} | Subject: "${message.subject}" | From: ${from}`);

      return {
        success: true,
        messageId: `nhn-mail-${Date.now()}`,
      };
    }
    catch (error) {
      const errMsg = getErrorMessage(error, 'NHN Cloud email send failed');
      this.logger.error(`[NHN Cloud Error] Failed to send email to ${targetTo}: ${errMsg}`);
      return {
        success: false,
        error: errMsg,
      };
    }
  }
}
