import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { createTransport, type Transporter } from 'nodemailer';
import type { SentMessageInfo } from 'nodemailer/lib/smtp-transport';

import type { EmailAdapterResult, EmailMessage, IEmailAdapter } from '#/infra/notification/channels/email/email.interface';
import { NOTIFICATION_MODULE_OPTIONS, type NotificationModuleOptions } from '#/infra/notification/notification.interface';

/**
 * 자체 SMTP 서버 / Nodemailer 연동 어댑터
 */
@Injectable()
export class SmtpEmailAdapter implements IEmailAdapter {
  readonly providerName = 'smtp';
  private readonly logger = new Logger(SmtpEmailAdapter.name);
  private readonly transporter: Transporter<SentMessageInfo> | null = null;
  private readonly defaultFrom: string;

  constructor(
    @Inject(NOTIFICATION_MODULE_OPTIONS)
    options: NotificationModuleOptions,
  ) {
    const config = options.email?.smtp;
    this.defaultFrom = config?.from ?? '';

    if (config) {
      // eslint-disable-next-line sonarjs/no-clear-text-protocols -- Nodemailer transport configuration
      this.transporter = createTransport<SentMessageInfo>(config);
      this.logger.log(`Nodemailer initialized with SMTP target ${String(config.host)} (port: ${String(config.port)})`);
    }
  }

  async send(message: EmailMessage): Promise<EmailAdapterResult> {
    const targetTo = typeof message.to === 'string' ? message.to : JSON.stringify(message.to);

    if (!this.transporter) {
      this.logger.warn(`SMTP configuration is missing. Cannot send email to ${targetTo}`);
      return {
        success: false,
        error: 'SMTP configuration is missing in NotificationModuleOptions',
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.defaultFrom,
        ...message,
      });

      this.logger.log(`[SMTP Mail Sent] MessageId: ${info.messageId} to ${targetTo}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    }
    catch (error) {
      const errMsg = ApplicationError.from(error, 'EMAIL_SEND_FAILED').message;
      this.logger.error(`Failed to send email via SMTP to ${targetTo}: ${errMsg}`);
      return {
        success: false,
        error: errMsg,
      };
    }
  }
}
