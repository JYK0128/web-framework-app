import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { createTransport, type Transporter } from 'nodemailer';
import type { SentMessageInfo } from 'nodemailer/lib/smtp-transport';

import type { EmailMessage, EmailProviderResult, IEmailProvider } from '#/infra/notification/channels/email/email.interface';
import { NOTIFICATION_MODULE_OPTIONS, type NotificationModuleOptions } from '#/infra/notification/notification.interface';

/**
 * 자체 SMTP 서버 / Nodemailer 기반 이메일 공급자
 */
@Injectable()
export class SmtpEmailProvider implements IEmailProvider {
  readonly providerName = 'smtp';
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private readonly transporter: Transporter<SentMessageInfo>;
  private readonly defaultFrom: string;

  constructor(
    @Inject(NOTIFICATION_MODULE_OPTIONS)
    options: NotificationModuleOptions,
  ) {
    if (!options.email?.smtp) {
      throw new Error('SMTP configuration is missing in NotificationModuleOptions');
    }
    const config = options.email.smtp;
    this.defaultFrom = config.from;

    // eslint-disable-next-line sonarjs/no-clear-text-protocols -- Nodemailer transport configuration
    this.transporter = createTransport<SentMessageInfo>(config);
    this.logger.log(`Nodemailer initialized with SMTP target ${String(config.host)} (port: ${String(config.port)})`);
  }

  async send(message: EmailMessage): Promise<EmailProviderResult> {
    const targetTo = typeof message.to === 'string' ? message.to : JSON.stringify(message.to);

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
      const errMsg = ApplicationError.getMessage(error, 'Unknown email error');
      this.logger.error(`Failed to send email via SMTP to ${targetTo}: ${errMsg}`);
      return {
        success: false,
        error: errMsg,
      };
    }
  }
}
