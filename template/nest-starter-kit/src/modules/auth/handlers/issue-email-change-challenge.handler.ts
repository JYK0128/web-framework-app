import { randomBytes, randomUUID } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { verify } from '@pkg/shared/server';
import { addMinutes } from 'date-fns';

import { RequestContext } from '#/common/contexts/request.context';
import { VerificationStore } from '#/common/stores/verification.store';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { NotificationService, TemplateRendererService } from '#/infra/notification';
import { type EmailChangePayload, IssueEmailChangeChallengeCommand } from '#/modules/auth/commands/issue-email-change-challenge.command';
import type { IssueEmailChangeChallengeResponseDto } from '#/modules/auth/dto/issue-email-change-challenge.response.dto';

const EMAIL_CHANGE_EXPIRY_MINUTES = 15;

@Injectable()
@CommandHandler(IssueEmailChangeChallengeCommand)
export class IssueEmailChangeChallengeHandler implements ICommandHandler<IssueEmailChangeChallengeCommand, IssueEmailChangeChallengeResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
    private readonly verificationStore: VerificationStore,
    private readonly notification: NotificationService,
    private readonly templateRenderer: TemplateRendererService,
  ) {}

  async execute(command: IssueEmailChangeChallengeCommand): Promise<IssueEmailChangeChallengeResponseDto> {
    const user = await this.identifyUser();
    const newEmail = this.normalizeEmail(command.input.newEmail);

    await this.verifyCurrentPassword(user.id, command.input.currentPassword);
    this.verifyEmailNotSame(user.email, newEmail);
    await this.verifyEmailAvailable(newEmail, user.id);

    return this.process(user.id, newEmail);
  }

  private async identifyUser(): Promise<User> {
    const sessionUser = this.requestContext.request?.session.user;
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const user = await this.em.findOne(User, { id: sessionUser.id });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return user;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async verifyCurrentPassword(userId: string, currentPassword?: string): Promise<void> {
    const credentialAccount = await this.em.findOne(Account, {
      user: userId,
      providerId: Account.PROVIDER_CREDENTIAL,
    });

    // If user has a password-based credential account, verify password
    if (credentialAccount?.password) {
      if (!currentPassword) {
        throw new ApplicationError({
          code: 'CURRENT_PASSWORD_REQUIRED',
          status: HttpStatus.BAD_REQUEST,
          message: '현재 비밀번호를 입력해주세요.',
        });
      }

      const isValid = await verify(currentPassword, credentialAccount.password);
      if (!isValid) {
        throw new ApplicationError({
          code: 'INVALID_CURRENT_PASSWORD',
          status: HttpStatus.BAD_REQUEST,
          message: '현재 비밀번호가 일치하지 않습니다.',
        });
      }
    }
  }

  private verifyEmailNotSame(currentEmail: string, newEmail: string): void {
    if (currentEmail.toLowerCase() === newEmail) {
      throw new ApplicationError({
        code: 'SAME_EMAIL_ADDRESS',
        status: HttpStatus.BAD_REQUEST,
        message: '현재 사용 중인 이메일과 동일합니다.',
      });
    }
  }

  private async verifyEmailAvailable(newEmail: string, userId: string): Promise<void> {
    const existing = await this.em.findOne(User, { email: newEmail, id: { $ne: userId } });
    if (existing) {
      throw new ApplicationError({
        code: 'EMAIL_ALREADY_REGISTERED',
        status: HttpStatus.CONFLICT,
        message: '이미 다른 계정에 등록된 이메일 주소입니다.',
      });
    }
  }

  private async process(userId: string, newEmail: string): Promise<IssueEmailChangeChallengeResponseDto> {
    const challengeId = randomUUID();
    const token = randomBytes(32).toString('base64url');
    const payload: EmailChangePayload = { challengeId, userId, newEmail, token };
    const expiresAt = addMinutes(new Date(), EMAIL_CHANGE_EXPIRY_MINUTES).getTime();

    await this.verificationStore.save(`email-change:${challengeId}`, {
      value: JSON.stringify(payload),
      expiresAt,
    });

    const targetUrl = new URL('/verify-email-change', env.FRONTEND_URL);
    targetUrl.searchParams.set('challengeId', challengeId);
    targetUrl.searchParams.set('token', token);
    const magicLink = targetUrl.toString();

    const rendered = await this.templateRenderer.render(
      'AUTH_VERIFY_EMAIL',
      {
        appName: env.APP_NAME,
        targetLink: magicLink,
        minutes: EMAIL_CHANGE_EXPIRY_MINUTES,
        code: token,
        challengeId,
      },
      {
        locale: 'ko',
        fallback: {
          title: `[${env.APP_NAME}] 이메일 변경 인증 안내`,
          body: `이메일 인증 링크: ${magicLink} (${EMAIL_CHANGE_EXPIRY_MINUTES}분 동안 유효합니다.)`,
        },
      },
    );

    await this.notification.sendEmail({
      to: newEmail,
      subject: rendered.title || `[${env.APP_NAME}] 이메일 변경 인증 안내`,
      html: rendered.body,
      text: rendered.body.replace(/<[^>]*>?/gm, ''),
    });

    return {
      ok: true,
      challengeId,
      expiresIn: EMAIL_CHANGE_EXPIRY_MINUTES * 60,
      newEmail,
      devMagicLink: env.NODE_ENV !== 'production' ? magicLink : undefined,
    };
  }
}
