import { Injectable } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { EmailService } from '#/common/services/email/email.service';
import { env } from '#/env';
import { EmailVerificationCodeIssuedEvent } from '#/modules/onboarding/events/email-verification-code-issued.event';

@Injectable()
@EventsHandler(EmailVerificationCodeIssuedEvent)
export class SendEmailVerificationMailEventHandler implements IEventHandler<EmailVerificationCodeIssuedEvent> {
  constructor(private readonly emailService: EmailService) {}

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

    await this.emailService.sendMail({
      to: email,
      subject,
      html,
      text,
    });
  }
}
