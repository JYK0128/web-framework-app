import { Injectable } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { EmailService } from '#/common/services/email/email.service';
import { env } from '#/env';
import { EmailChallengeIssuedEvent } from '#/modules/onboarding/events/email-challenge-issued.event';

@Injectable()
@EventsHandler(EmailChallengeIssuedEvent)
export class SendEmailVerificationMailEventHandler implements IEventHandler<EmailChallengeIssuedEvent> {
  constructor(private readonly emailService: EmailService) {}

  async handle(event: EmailChallengeIssuedEvent): Promise<void> {
    const { email, challengeId, code, expiresIn } = event;
    const minutes = Math.floor(expiresIn / 60);
    const subject = `[${env.APP_NAME}] 이메일 인증 안내`;
    const targetUrl = new URL('/onboarding/email', env.FRONTEND_URL);
    targetUrl.searchParams.set('challengeId', challengeId);
    targetUrl.searchParams.set('code', code);
    const targetLink = targetUrl.toString();

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 16px;">이메일 인증 안내</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          안녕하세요. <strong>${env.APP_NAME}</strong> 이메일 소유권 확인을 위한 안내 메일입니다.<br/>
          아래의 버튼을 클릭하시면 이메일 인증이 즉시 완료됩니다.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${targetLink}" style="background-color: #2563eb; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block;">
            이메일 인증 완료하기
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
          * 이 인증 링크는 <strong>${minutes}분</strong> 동안 유효합니다.<br/>
          * 본인이 요청하지 않은 경우 이 메일을 무시하셔도 됩니다.<br/>
          * 버튼이 작동하지 않는 경우 아래 링크를 브라우저에 직접 붙여넣어 주세요:<br/>
          <a href="${targetLink}" style="color: #2563eb; word-break: break-all; font-size: 12px;">${targetLink}</a>
        </p>
      </div>
    `;

    const text = `[${env.APP_NAME}] 이메일 인증 링크: ${targetLink} (${minutes}분 동안 유효합니다.)`;

    await this.emailService.sendMail({
      to: email,
      subject,
      html,
      text,
    });
  }
}
