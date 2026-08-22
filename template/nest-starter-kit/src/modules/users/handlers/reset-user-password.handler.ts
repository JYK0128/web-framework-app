import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { hash, randomBase64Url } from '@pkg/shared/server';

import { SessionStore } from '#/common/stores/session.store';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { ResetUserPasswordCommand } from '#/modules/users/commands/reset-user-password.command';
import { ResetPasswordResponseDto } from '#/modules/users/dto';

@Injectable()
@CommandHandler(ResetUserPasswordCommand)
export class ResetUserPasswordHandler implements ICommandHandler<ResetUserPasswordCommand, ResetPasswordResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionStore: SessionStore,
  ) {}

  async execute(command: ResetUserPasswordCommand): Promise<ResetPasswordResponseDto> {
    const user = await this.identifyUser(command.input.id);
    this.verifyNotDeleted(user);

    const account = await this.identifyAccount(user.id);

    return this.process(user, account);
  }

  private async identifyUser(id: string): Promise<User> {
    const user = await this.em.findOne(User, { id }, { filters: false });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return user;
  }

  private verifyNotDeleted(user: User): void {
    if (user.isDeleted) {
      throw new ApplicationError({ code: 'USER_DELETED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async identifyAccount(userId: string): Promise<Account | null> {
    return this.em.findOne(Account, {
      user: userId,
      accountId: userId,
      providerId: Account.PROVIDER_CREDENTIAL,
    }, { filters: false });
  }

  private async process(user: User, account: Account | null): Promise<ResetPasswordResponseDto> {
    const temporaryPassword = `Aa1!${randomBase64Url(12)}`;
    const newHashedPassword = await hash(temporaryPassword);
    const history = account?.metadata?.passwordHistory || [];
    const updatedHistory = [newHashedPassword, ...history].slice(0, 3);

    if (account) {
      account.password = newHashedPassword;
      account.updateMetadata({
        failedLoginAttempts: null,
        lockedUntil: null,
        passwordUpdatedAt: new Date(),
        passwordChangeDeferredUntil: null,
        passwordResetRequired: true,
        passwordHistory: updatedHistory,
      });
    }
    else {
      const credentialAccount = this.em.create(Account, {
        user,
        accountId: user.id,
        providerId: Account.PROVIDER_CREDENTIAL,
        password: newHashedPassword,
        metadata: {
          passwordUpdatedAt: new Date(),
          passwordResetRequired: true,
          passwordHistory: updatedHistory,
        },
      });
      this.em.persist(credentialAccount);
    }

    await this.sessionStore.destroyAll(user.id);

    return { temporaryPassword };
  }
}
