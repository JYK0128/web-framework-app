import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { verify } from '@pkg/shared/server';

import { AppEntityManager } from '#/database/entity-manager';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { LoginCredentialCommand } from '#/modules/auth/commands/login-credential.command';
import { LOGIN_FAILURE_LOCK_THRESHOLD, LOGIN_LOCK_DURATION_MS } from '#/modules/auth/constants/auth-policy.constants';
import { LoginCredentialOutputDto } from '#/modules/auth/dto/login-credential.output.dto';

const CREDENTIAL_PROVIDER = 'credential';

@Injectable()
@CommandHandler(LoginCredentialCommand)
export class LoginCredentialHandler implements ICommandHandler<LoginCredentialCommand, LoginCredentialOutputDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: LoginCredentialCommand): Promise<LoginCredentialOutputDto> {
    const user = await this.identifyUser(command.input.email);
    this.verifyUser(user);

    const account = await this.identifyAccount(user.id);
    await this.verifyPassword(account, command.input.password);

    return this.process(user, account);
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
      providerId: CREDENTIAL_PROVIDER,
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
      const now = new Date();
      const currentAttempts = (account.metadata?.failedLoginAttempts ?? 0) + 1;
      const willLock = currentAttempts >= LOGIN_FAILURE_LOCK_THRESHOLD;

      account.updateMetadata({
        failedLoginAttempts: currentAttempts,
        lockedUntil: willLock ? new Date(now.getTime() + LOGIN_LOCK_DURATION_MS) : null,
      });
      await this.em.flush();

      throw new ApplicationError({
        code: willLock ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  private async process(user: User, account: Account): Promise<LoginCredentialOutputDto> {
    account.updateMetadata({
      failedLoginAttempts: null,
      lockedUntil: null,
    });
    user.updateMetadata({
      lastLoginAt: new Date(),
    });

    return {
      userId: user.id,
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }
}
