import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { verify } from '@pkg/shared/server';

import { SessionContext } from '#/common/contexts/session.context';
import { SystemContext } from '#/common/contexts/system.context';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { TwoFactorCreateChallengeCommand } from '#/modules/auth/commands/2fa-create-challenge.command';
import { LoginCredentialCommand } from '#/modules/auth/commands/login-credential.command';
import type { LoginCredentialResponseDto } from '#/modules/auth/dto/login-credential.response.dto';

@Injectable()
@CommandHandler(LoginCredentialCommand)
export class LoginCredentialHandler implements ICommandHandler<LoginCredentialCommand, LoginCredentialResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
    private readonly commandBus: CommandBus,
    private readonly systemContext: SystemContext,
  ) {}

  async execute(command: LoginCredentialCommand): Promise<LoginCredentialResponseDto> {
    const user = await this.identifyUser(command.input.email);
    this.verifyUser(user);

    const account = await this.identifyAccount(user.id);
    await this.verifyPassword(account, command.input.password);

    return this.process(user, account, command.input.rememberMe);
  }

  private async identifyUser(email: string): Promise<User> {
    const user = await this.em.findOne(User, { email });
    if (!user) {
      throw new ApplicationError({ code: 'INVALID_CREDENTIALS', status: HttpStatus.BAD_REQUEST });
    }
    return user;
  }

  private verifyUser(user: User): void {
    if (user.isBanned) {
      throw new ApplicationError({ code: 'USER_BANNED', status: HttpStatus.FORBIDDEN });
    }
    if (user.isDeleted) {
      throw new ApplicationError({ code: 'INVALID_CREDENTIALS', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async identifyAccount(userId: string): Promise<Account> {
    const account = await this.em.findOne(Account, {
      user: userId,
      providerId: Account.PROVIDER_CREDENTIAL,
    });

    if (!account?.password) {
      throw new ApplicationError({ code: 'INVALID_CREDENTIALS', status: HttpStatus.BAD_REQUEST });
    }

    return account;
  }

  private async verifyPassword(account: Account, password: string): Promise<void> {
    if (account.isLocked) {
      throw new ApplicationError({ code: 'ACCOUNT_LOCKED', status: HttpStatus.BAD_REQUEST });
    }

    const isPasswordValid = await verify(password, account.password!);
    if (!isPasswordValid) {
      const authPolicy = await this.systemContext.getAuthPolicy();
      const now = new Date();
      const currentAttempts = (account.metadata?.failedLoginAttempts ?? 0) + 1;
      const willLock = currentAttempts >= authPolicy.loginFailureThreshold;
      const lockDurationMs = authPolicy.loginLockDurationMinutes * 60 * 1000;

      account.updateMetadata({
        failedLoginAttempts: currentAttempts,
        lockedUntil: willLock ? new Date(now.getTime() + lockDurationMs) : null,
      });
      await this.em.flush();

      throw new ApplicationError({
        code: willLock ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  private async process(user: User, account: Account, rememberMe?: boolean): Promise<LoginCredentialResponseDto> {
    account.updateMetadata({
      failedLoginAttempts: null,
      lockedUntil: null,
    });
    user.updateMetadata({
      lastLoginAt: new Date(),
    });

    if (user.twoFactorEnabled) {
      const challenge = await this.commandBus.execute(
        new TwoFactorCreateChallengeCommand({ userId: user.id, rememberMe }),
      );
      return { challengeId: challenge.challengeId, expiresIn: challenge.expiresIn };
    }

    await this.sessionContext.establish({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      phoneNumber: user.phoneNumber ?? null,
      phoneNumberVerified: Boolean(user.phoneNumberVerified),
      role: user.role ?? null,
      permissions: {},
      requiredTermsAgreed: false,
      passwordUpdatedAt: account.metadata?.passwordUpdatedAt ?? null,
      isPasswordChangeRequired: false,
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
    }, { rememberMe });

    return { ok: true };
  }
}
