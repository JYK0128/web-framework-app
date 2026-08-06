import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { verify } from '@pkg/shared/server';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { LoginCredentialCommand } from '#/modules/auth/commands/login-credential.command';
import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

const CREDENTIAL_PROVIDER = 'credential';
const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

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
      const isWithinGracePeriod = Date.now() - user.deletedAt.getTime() <= GRACE_PERIOD_MS;
      if (isWithinGracePeriod) {
        throw new ApplicationError({ code: 'ACCOUNT_DELETED_PENDING', status: HttpStatus.FORBIDDEN });
      }
      throw new ApplicationError({ code: 'INVALID_CREDENTIALS', status: HttpStatus.UNAUTHORIZED });
    }

    const lockedStr = account.metadata?.lockedUntil;
    const lockedUntil = lockedStr ? new Date(lockedStr) : null;
    if (lockedUntil && lockedUntil > new Date()) {
      throw new ApplicationError({ code: 'ACCOUNT_LOCKED', status: HttpStatus.UNAUTHORIZED });
    }

    if (!(await verify(password, account.password))) {
      const failedAttempts = (account.metadata?.failedLoginAttempts as number || 0) + 1;
      const nextLock = failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;

      account.metadata = {
        ...(account.metadata || {}),
        failedLoginAttempts: failedAttempts,
        ...(nextLock ? { lockedUntil: nextLock } : {}),
      };

      await this.em.flush();
      throw new ApplicationError({ code: 'INVALID_CREDENTIALS', status: HttpStatus.UNAUTHORIZED });
    }

    if (account.metadata) {
      delete account.metadata.failedLoginAttempts;
      delete account.metadata.lockedUntil;
    }
    await this.em.flush();

    return new UserProfileResponseDto(user);
  }
}
