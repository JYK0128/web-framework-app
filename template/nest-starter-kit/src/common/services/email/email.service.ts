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
  message?: string
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly isSmtpConfigured: boolean;
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

    this.isSmtpConfigured = Boolean(host);

    if (this.isSmtpConfigured) {
      this.transporter = createTransport({
        host,
        port,
        secure,
        auth: user
          ? {
            user,
            pass,
          }
          : undefined,
      });
      this.logger.log(`Nodemailer initialized with SMTP host: ${host ?? ''}:${port}`);
    }
    else {
      // eslint-disable-next-line sonarjs/no-clear-text-protocols
      this.transporter = createTransport({
        jsonTransport: true,
      });
      this.logger.log('Nodemailer initialized in local fallback mode (SMTP_HOST not set).');
    }
  }

  /**
   * 이메일을 발송합니다.
   * SMTP가 설정되지 않은 경우 jsonTransport를 통해 로컬 로그로 fallback 출력합니다.
   */
  async sendMail(options: SendMailOptions): Promise<{ success: boolean, messageId?: string }> {
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

      if (!this.isSmtpConfigured) {
        this.logger.log(
          `[Mail Fallback Output] To: ${options.to} | Subject: ${options.subject} | Message: ${info.message ?? info.messageId ?? 'ok'}`,
        );
      }
      else {
        this.logger.log(`[Mail Sent] MessageId: ${info.messageId ?? 'unknown'} to ${options.to}`);
      }

      return { success: true, messageId: info.messageId };
    }
    catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${getErrorMessage(error, 'Unknown email error')}`,
        error instanceof Error ? error.stack : undefined,
      );
      return { success: false };
    }
  }
}
