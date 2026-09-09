import { randomBytes, randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { valueIf } from '@pkg/shared/common';
import { addMinutes } from 'date-fns';

import { SystemContext } from '#/common/contexts/system.context';
import { VerificationStore } from '#/common/stores/verification.store';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { NotificationService, TemplateRendererService } from '#/infra/notification';
import { IssuePasswordResetChallengeCommand } from '#/modules/auth/commands/issue-password-reset-challenge.command';
import type { IssuePasswordResetChallengeResponseDto } from '#/modules/auth/dto/issue-password-reset-challenge.response.dto';

export interface PasswordResetChallengePayload {
  challengeId: string
  userId: string
  email: string
  token: string
}

@Injectable()
@CommandHandler(IssuePasswordResetChallengeCommand)
export class IssuePasswordResetChallengeHandler implements ICommandHandler<IssuePasswordResetChallengeCommand, IssuePasswordResetChallengeResponseDto> {
  private readonly logger = new Logger(IssuePasswordResetChallengeHandler.name);

  constructor(
    private readonly em: AppEntityManager,
    private readonly systemContext: SystemContext,
    private readonly verificationStore: VerificationStore,
    private readonly notification: NotificationService,
    private readonly templateRenderer: TemplateRendererService,
  ) {}

  async execute(command: IssuePasswordResetChallengeCommand): Promise<IssuePasswordResetChallengeResponseDto> {
    const input = this.identify(command);
    this.verify(input);
    const expiryMinutes = (await this.systemContext.getVerificationPolicy()).passwordResetChallengeExpiryMinutes;
    const email = input.email;
    const user = await this.em.findOne(User, { email }, { populate: ['accounts'] });

    // 보안을 위해 사용자가 존재하지 않아도 성공처럼 응답 (User Enumeration 방지)
    if (!user) {
      this.logger.debug(`Password reset requested for non-existing email: ${email}`);
      return {
        ok: true,
        expiresIn: expiryMinutes * 60,
      };
    }

    const credentialAccount = user.accounts.getItems().find((acc) => acc.providerId === Account.PROVIDER_CREDENTIAL);
    if (!credentialAccount || !credentialAccount.password) {
      const oauthAccount = user.accounts.getItems().find((acc) => acc.providerId !== Account.PROVIDER_CREDENTIAL);
      return {
        ok: true,
        expiresIn: 0,
        isOAuthUser: true,
        oauthProvider: oauthAccount?.providerId,
      };
    }

    return this.process(user.id, user.email, user.name, expiryMinutes);
  }

  private identify(command: IssuePasswordResetChallengeCommand): { email: string } {
    return { email: command.input.email.trim().toLowerCase() };
  }

  private verify(input: { email: string }): void {
    if (!input.email) {
      throw new Error('비밀번호 재설정 이메일이 필요합니다.');
    }
  }

  private async process(userId: string, email: string, name: string, expiryMinutes: number): Promise<IssuePasswordResetChallengeResponseDto> {
    const challengeId = randomUUID();
    const token = randomBytes(32).toString('base64url');
    const payload: PasswordResetChallengePayload = { challengeId, userId, email, token };
    const expiresAt = addMinutes(new Date(), expiryMinutes).getTime();

    await this.verificationStore.save(`password-reset:${challengeId}`, {
      value: JSON.stringify(payload),
      expiresAt,
    });

    const targetUrl = new URL('/reset-password', env.FRONTEND_URL);
    targetUrl.searchParams.set('challengeId', challengeId);
    targetUrl.searchParams.set('token', token);
    const magicLink = targetUrl.toString();

    try {
      const rendered = await this.templateRenderer.render(
        'AUTH_RESET_PASSWORD',
        {
          appName: env.APP_NAME,
          userName: name,
          targetLink: magicLink,
          minutes: expiryMinutes,
          token,
          challengeId,
        },
        {
          fallback: {
            title: `[${env.APP_NAME}] 비밀번호 재설정 안내`,
            body: `비밀번호 재설정 링크: ${magicLink} (${expiryMinutes}분 동안 유효합니다.)`,
          },
        },
      );

      await this.notification.sendEmail({
        to: email,
        subject: rendered.title || `[${env.APP_NAME}] 비밀번호 재설정 안내`,
        html: rendered.body,
        text: rendered.body.replace(/<[^>]*>?/gm, ''),
      });
    }
    catch (err) {
      this.logger.error(`Failed to send password reset email to ${email}`, err);
    }

    return {
      ok: true,
      expiresIn: expiryMinutes * 60,
      devMagicLink: valueIf(env.NODE_ENV !== 'production', magicLink),
    };
  }
}
