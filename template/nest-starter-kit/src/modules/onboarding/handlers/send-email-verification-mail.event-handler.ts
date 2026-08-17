import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { createTransport, type Transporter } from 'nodemailer';

import { env } from '#/env';
import { EmailVerificationCodeIssuedEvent } from '#/modules/onboarding/events/email-verification-code-issued.event';

interface MailResult {
  messageId?: string
  message?: string
}

@Injectable()
@EventsHandler(EmailVerificationCodeIssuedEvent)
export class SendEmailVerificationMailEventHandler implements IEventHandler<EmailVerificationCodeIssuedEvent> {
  private readonly logger = new Logger(SendEmailVerificationMailEventHandler.name);
  private readonly transporter: Transporter;
  private readonly isSmtpConfigured: boolean;

  constructor() {
    this.isSmtpConfigured = Boolean(env.SMTP_HOST);

    if (this.isSmtpConfigured) {
      this.transporter = createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: env.SMTP_USER
          ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
          : undefined,
      });
      this.logger.log(`Nodemailer initialized with SMTP host: ${env.SMTP_HOST ?? ''}:${env.SMTP_PORT}`);
    }
    else {
      // eslint-disable-next-line sonarjs/no-clear-text-protocols
      this.transporter = createTransport({
        jsonTransport: true,
      });
      this.logger.log('Nodemailer initialized in local fallback mode (SMTP_HOST not set).');
    }
  }

  async handle(event: EmailVerificationCodeIssuedEvent): Promise<void> {
    const { email, code, expiresIn } = event;
    const minutes = Math.floor(expiresIn / 60);
    const subject = `[${env.APP_NAME}] 이메일 인증번호 안내`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 16px;">이메일 인증번호</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          안녕하세요. <strong>${env.APP_NAME}</strong> 회원가입 및 본인 확인을 위한 인증번호입니다.<br/>
          아래의 6자리 인증번호를 입력창에 입력해 주세요.
        </p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1f2937; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
          * 이 인증번호는 <strong>${minutes}분</strong> 동안 유효합니다.<br/>
          * 본인이 요청하지 않은 경우 이 메일을 무시하셔도 됩니다.
        </p>
      </div>
    `;

    const text = `[${env.APP_NAME}] 이메일 인증번호: [${code}] (${minutes}분 동안 유효합니다.)`;

    try {
      const sendPromise = this.transporter.sendMail({
        from: env.SMTP_FROM,
        to: email,
        subject,
        html,
        text,
      }) as Promise<MailResult>;

      const info = await sendPromise;

      if (!this.isSmtpConfigured) {
        this.logger.log(`[Mail Fallback Output] To: ${email} | Subject: ${subject} | Message: ${info.message ?? info.messageId ?? 'ok'}`);
      }
      else {
        this.logger.log(`[Mail Sent] MessageId: ${info.messageId ?? 'unknown'} to ${email}`);
      }
    }
    catch (error) {
      this.logger.error(
        `[Email Verification] Failed to send verification email to ${email}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
