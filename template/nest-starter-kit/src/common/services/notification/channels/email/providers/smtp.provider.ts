import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';

import { getErrorMessage } from '#/common/helpers/error.helper';
import type { EmailMessage, EmailProviderResult, IEmailProvider } from '#/common/services/notification/channels/email/email.interface';
import { env } from '#/env';

interface MailResult {
  messageId?: string
}

/**
 * 자체 SMTP 서버 / Nodemailer 기반 이메일 공급자
 */
@Injectable()
export class SmtpEmailProvider implements IEmailProvider {
  readonly providerName = 'smtp';
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private readonly transporter: Transporter;
  private readonly defaultFrom: string;

  constructor() {
    const host = env.SMTP_HOST;
    const port = env.SMTP_PORT;
    const secure = env.SMTP_SECURE;
    const user = env.SMTP_USER;
    const pass = env.SMTP_PASS;
    this.defaultFrom = env.SMTP_FROM;

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

  async send(message: EmailMessage): Promise<EmailProviderResult> {
    const from = message.from || this.defaultFrom;
    const targetTo = Array.isArray(message.to) ? message.to.join(', ') : message.to;

    try {
      const sendPromise = this.transporter.sendMail({
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        replyTo: message.replyTo,
        cc: message.cc,
        bcc: message.bcc,
        attachments: message.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      }) as Promise<MailResult>;

      const info = await sendPromise;
      this.logger.log(`[SMTP Mail Sent] MessageId: ${info.messageId ?? 'unknown'} to ${targetTo}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    }
    catch (error) {
      const errMsg = getErrorMessage(error, 'Unknown email error');
      this.logger.error(`Failed to send email via SMTP to ${targetTo}: ${errMsg}`);
      return {
        success: false,
        error: errMsg,
      };
    }
  }
}
