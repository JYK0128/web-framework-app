import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError, jsonSafeParse } from '@pkg/shared/common';
import { hash, verify } from '@pkg/shared/server';

import { SystemContext } from '#/common/contexts/system.context';
import { SessionStore } from '#/common/stores/session.store';
import { VerificationStore } from '#/common/stores/verification.store';
import { Account } from '#/entities/auth/account.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { ResetPasswordCommand } from '#/modules/auth/commands/reset-password.command';
import type { ResetPasswordResponseDto } from '#/modules/auth/dto/reset-password.response.dto';
import type { PasswordResetChallengePayload } from '#/modules/auth/handlers/issue-password-reset-challenge.handler';

@Injectable()
@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand, ResetPasswordResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly systemContext: SystemContext,
    private readonly verificationStore: VerificationStore,
    private readonly sessionStore: SessionStore,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<ResetPasswordResponseDto> {
    const { challengeId, token, newPassword } = command.input;

    const policy = await this.systemContext.getAuthPolicy();
    const payload = await this.identifyChallenge(challengeId, token);
    const account = await this.identifyAccount(payload.userId);

    await this.verify(account, newPassword, policy.historyLimit, policy);

    return this.process(payload.userId, account, newPassword, policy.historyLimit);
  }

  private async identifyChallenge(challengeId: string, token: string): Promise<PasswordResetChallengePayload> {
    const record = await this.verificationStore.consume(`password-reset:${challengeId}`);
    if (!record || record.expiresAt <= Date.now()) {
      throw new ApplicationError({
        code: 'INVALID_OR_EXPIRED_TOKEN',
        status: HttpStatus.BAD_REQUEST,
        message: '유효하지 않거나 만료된 재설정 링크입니다.',
      });
    }

    const payload = jsonSafeParse<PasswordResetChallengePayload>(record.value);
    if (!payload || payload.token !== token) {
      throw new ApplicationError({
        code: 'INVALID_OR_EXPIRED_TOKEN',
        status: HttpStatus.BAD_REQUEST,
        message: '유효하지 않거나 일치하지 않는 토큰입니다.',
      });
    }

    return payload;
  }

  private async identifyAccount(userId: string): Promise<Account> {
    const account = await this.em.findOne(Account, {
      user: userId,
      providerId: Account.PROVIDER_CREDENTIAL,
    });

    if (!account) {
      throw new ApplicationError({
        code: 'PASSWORD_ACCOUNT_NOT_FOUND',
        status: HttpStatus.BAD_REQUEST,
        message: '비밀번호를 재설정할 수 있는 계정을 찾을 수 없습니다.',
      });
    }

    return account;
  }

  private async verifyNewPassword(account: Account, newPassword: string, historyLimit: number): Promise<void> {
    const history = (account.metadata?.passwordHistory ?? []).slice(0, historyLimit);
    for (const previousHash of history) {
      if (await verify(newPassword, previousHash)) {
        throw new ApplicationError({
          code: 'PASSWORD_RECENTLY_USED',
          status: HttpStatus.BAD_REQUEST,
          message: '최근에 사용한 비밀번호는 다시 사용할 수 없습니다.',
        });
      }
    }
  }

  private async verify(
    account: Account,
    newPassword: string,
    historyLimit: number,
    policy: Awaited<ReturnType<SystemContext['getAuthPolicy']>>,
  ): Promise<void> {
    await this.systemContext.validatePassword(newPassword, policy);
    await this.verifyNewPassword(account, newPassword, historyLimit);
  }

  private async process(userId: string, account: Account, newPassword: string, historyLimit: number): Promise<ResetPasswordResponseDto> {
    const newHashedPassword = await hash(newPassword);
    const history = account.metadata?.passwordHistory || [];
    const updatedHistory = [newHashedPassword, ...history].slice(0, Math.max(0, historyLimit));

    account.password = newHashedPassword;
    account.updateMetadata({
      passwordUpdatedAt: new Date(),
      passwordChangeDeferredUntil: null,
      passwordResetRequired: false,
      passwordHistory: updatedHistory,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    await this.sessionStore.destroyAll(userId);

    return { ok: true };
  }
}
