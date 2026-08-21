import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';

import { getErrorMessage } from '#/common/helpers/error.helper';
import { env } from '#/env';

export const EMAIL_MODULE_OPTIONS = Symbol('EMAIL_MODULE_OPTIONS');

export interface EmailModuleOptions {
  smtpHost?: string
  smtpPort?: number
  smtpSecure?: boolean
  smtpUser?: string
  smtpPass?: string
  smtpFrom?: string
}

export interface SendMailOptions {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

interface MailResult {
  messageId?: string
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly defaultFrom: string;

  constructor(
    @Optional()
    @Inject(EMAIL_MODULE_OPTIONS)
    options?: EmailModuleOptions,
  ) {
    const host = options?.smtpHost ?? env.SMTP_HOST;
    const port = options?.smtpPort ?? env.SMTP_PORT;
    const secure = options?.smtpSecure ?? env.SMTP_SECURE;
    const user = options?.smtpUser ?? env.SMTP_USER;
    const pass = options?.smtpPass ?? env.SMTP_PASS;
    this.defaultFrom = options?.smtpFrom ?? env.SMTP_FROM;

    this.transporter = createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
    this.logger.log(`Nodemailer initialized with SMTP host: ${host}:${port}`);
  }

  async sendMail(options: SendMailOptions): Promise<{ messageId?: string }> {
    const from = options.from || this.defaultFrom;

    try {
      const sendPromise = this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }) as Promise<MailResult>;

      const info = await sendPromise;

      this.logger.log(`[Mail Sent] MessageId: ${info.messageId ?? 'unknown'} to ${options.to}`);

      return { messageId: info.messageId };
    }
    catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${getErrorMessage(error, 'Unknown email error')}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
