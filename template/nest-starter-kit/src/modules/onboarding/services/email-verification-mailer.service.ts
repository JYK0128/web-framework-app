import { Injectable } from '@nestjs/common';

import { env } from '#/env';
import { NotificationService, TemplateRendererService } from '#/infra/notification';
import type { IssueEmailChallengeResult } from '#/modules/onboarding/commands/issue-email-challenge.command';

@Injectable()
export class EmailVerificationMailer {
  constructor(
    private readonly notification: NotificationService,
    private readonly templateRenderer: TemplateRendererService,
  ) {}

  async send(challenge: IssueEmailChallengeResult): Promise<void> {
    const { email, challengeId, code, expiresIn } = challenge;
    const minutes = Math.floor(expiresIn / 60);
    const targetUrl = new URL('/verify-email', env.FRONTEND_URL);
    targetUrl.searchParams.set('challengeId', challengeId);
    targetUrl.searchParams.set('code', code);
    const targetLink = targetUrl.toString();

    const rendered = await this.templateRenderer.render(
      'AUTH_VERIFY_EMAIL',
      {
        appName: env.APP_NAME,
        targetLink,
        minutes,
        code,
        challengeId,
      },
      {
        locale: 'ko',
        fallback: {
          title: `[${env.APP_NAME}] 이메일 인증 안내`,
          body: `이메일 인증 링크: ${targetLink} (${minutes}분 동안 유효합니다.)`,
        },
      },
    );

    await this.notification.sendEmail({
      to: email,
      subject: rendered.title || `[${env.APP_NAME}] 이메일 인증 안내`,
      html: rendered.body,
      text: rendered.body.replace(/<[^>]*>?/gm, ''),
    });
  }
}
