import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { hash, verify } from '@pkg/shared/server';
import { ClsService } from 'nestjs-cls';

import { AuthCacheService } from '#/common/security/auth-cache.service';
import { AppEntityManager } from '#/database/entity-manager';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { ChangePasswordCommand } from '#/modules/auth/commands/change-password.command';
import { ChangePasswordResponseDto } from '#/modules/auth/dto/change-password.response.dto';

const CREDENTIAL_PROVIDER = 'credential';
const PASSWORD_HISTORY_LIMIT = 3;

@Injectable()
@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand, ChangePasswordResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly authCacheService: AuthCacheService,
    private readonly cls: ClsService,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<ChangePasswordResponseDto> {
    const user = await this.identifyUser();
    const account = await this.identifyAccount(user.id);
    await this.verifyCurrentPassword(account, command.input.currentPassword);

    const history = this.identifyHistory(account);
    await this.verifyPasswordReuse(history, command.input.newPassword);

    return this.process(user.id, account, history, command.input.newPassword);
  }

  private async identifyUser(): Promise<User> {
    const sessionUser = this.cls.get('user');
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const user = await this.em.findOne(User, { id: sessionUser.id });
    if (!user) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    return user;
  }

  private async identifyAccount(userId: string): Promise<Account> {
    const account = await this.em.findOne(Account, {
      user: userId,
      accountId: userId,
      providerId: CREDENTIAL_PROVIDER,
    });

    if (!account) {
      throw new ApplicationError({ code: 'PASSWORD_CHANGE_UNAVAILABLE', status: HttpStatus.BAD_REQUEST });
    }

    return account;
  }

  private identifyHistory(account: Account): string[] {
    return account.metadata?.passwordHistory || [];
  }

  private async verifyCurrentPassword(account: Account, currentPassword: string): Promise<void> {
    if (!account.password) {
      throw new ApplicationError({ code: 'PASSWORD_CHANGE_UNAVAILABLE', status: HttpStatus.BAD_REQUEST });
    }

    const isCurrentPasswordValid = await verify(currentPassword, account.password);
    if (!isCurrentPasswordValid) {
      throw new ApplicationError({ code: 'INVALID_CURRENT_PASSWORD', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async verifyPasswordReuse(history: string[], newPassword: string): Promise<void> {
    for (const previousHash of history) {
      if (await verify(newPassword, previousHash)) {
        throw new ApplicationError({ code: 'PASSWORD_RECENTLY_USED', status: HttpStatus.BAD_REQUEST });
      }
    }
  }

  private async process(
    userId: string,
    account: Account,
    history: string[],
    newPassword: string,
  ): Promise<ChangePasswordResponseDto> {
    const newHashedPassword = await hash(newPassword);
    const updatedHistory = [newHashedPassword, ...history].slice(0, PASSWORD_HISTORY_LIMIT);

    account.password = newHashedPassword;
    account.updateMetadata({
      passwordUpdatedAt: new Date(),
      passwordChangeDeferredUntil: null,
      passwordResetRequired: false,
      passwordHistory: updatedHistory,
    });

    await this.authCacheService.invalidateUserState(userId);

    return { ok: true };
  }
}
