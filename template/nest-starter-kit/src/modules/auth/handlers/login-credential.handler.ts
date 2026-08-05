import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { verify } from '@pkg/shared/server';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { CREDENTIAL_PROVIDER, normalizeEmail } from '#/modules/auth/auth.helpers';
import { LoginCredentialCommand } from '#/modules/auth/commands/login-credential.command';
import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

@Injectable()
@CommandHandler(LoginCredentialCommand)
export class LoginCredentialHandler implements ICommandHandler<LoginCredentialCommand, UserProfileResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: LoginCredentialCommand): Promise<UserProfileResponseDto> {
    const user = await this.em.findOne(User, { email: normalizeEmail(command.input.email) });
    const account = user
      ? await this.em.findOne(Account, {
        user: user.id,
        accountId: user.id,
        providerId: CREDENTIAL_PROVIDER,
      })
      : null;
    if (!user || !account?.password) {
      throw new ApplicationError({ code: 'INVALID_CREDENTIALS', status: HttpStatus.UNAUTHORIZED });
    }

    const lockedUntilStr = account.metadata?.lockedUntil;
    const lockedUntil = lockedUntilStr ? new Date(lockedUntilStr) : null;

    if (lockedUntil && lockedUntil > new Date()) {
      throw new ApplicationError({ code: 'ACCOUNT_LOCKED', status: HttpStatus.UNAUTHORIZED });
    }

    if (!(await verify(command.input.password, account.password))) {
      const failedLoginAttempts = (account.metadata?.failedLoginAttempts as number || 0) + 1;

      const nextLockedUntil = failedLoginAttempts >= 5
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
        : null;

      account.metadata = {
        ...(account.metadata || {}),
        failedLoginAttempts,
        ...(nextLockedUntil ? { lockedUntil: nextLockedUntil } : {}),
      };

      await this.em.flush();
      throw new ApplicationError({ code: 'INVALID_CREDENTIALS', status: HttpStatus.UNAUTHORIZED });
    }

    // Reset lockout counters on successful login
    if (account.metadata) {
      delete account.metadata.failedLoginAttempts;
      delete account.metadata.lockedUntil;
    }
    await this.em.flush();

    return new UserProfileResponseDto(user);
  }
}
