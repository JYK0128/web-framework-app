import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { verify } from '@pkg/shared/server';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { LoginCredentialCommand } from '#/modules/auth/commands/login-credential.command';
import { LOGIN_FAILURE_LOCK_THRESHOLD, LOGIN_LOCK_DURATION_MS } from '#/modules/auth/constants/auth-policy.constants';
import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

const CREDENTIAL_PROVIDER = 'credential';
@Injectable()
@CommandHandler(LoginCredentialCommand)
export class LoginCredentialHandler implements ICommandHandler<LoginCredentialCommand, UserProfileResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: LoginCredentialCommand): Promise<UserProfileResponseDto> {
    const { email, password } = command.input;
    const user = await this.em.findOne(User, { email }, { filters: { softDelete: false } });
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

    if (user.deletedAt) {
      throw new ApplicationError({ code: 'INVALID_CREDENTIALS', status: HttpStatus.UNAUTHORIZED });
    }

    const lockedUntil = account.metadata?.lockedUntil;
    if (lockedUntil && lockedUntil > new Date()) {
      throw new ApplicationError({ code: 'ACCOUNT_LOCKED', status: HttpStatus.UNAUTHORIZED });
    }

    if (!(await verify(password, account.password))) {
      const failedAttempts = (account.metadata?.failedLoginAttempts as number || 0) + 1;
      const nextLock = failedAttempts >= LOGIN_FAILURE_LOCK_THRESHOLD
        ? new Date(Date.now() + LOGIN_LOCK_DURATION_MS)
        : null;

      account.updateMetadata({
        failedLoginAttempts: failedAttempts,
        ...(nextLock ? { lockedUntil: nextLock } : {}),
      });

      await this.em.flush();
      throw new ApplicationError({ code: 'INVALID_CREDENTIALS', status: HttpStatus.UNAUTHORIZED });
    }

    account.updateMetadata({
      failedLoginAttempts: null,
      lockedUntil: null,
    });
    await this.em.flush();

    return new UserProfileResponseDto(user);
  }
}
