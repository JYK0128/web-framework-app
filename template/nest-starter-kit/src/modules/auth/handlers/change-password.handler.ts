import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { hash, verify } from '@pkg/shared/server';

import { PASSWORD_HISTORY_LIMIT } from '#/common/configs/auth.config';
import { RequestContext } from '#/common/contexts/request.context';
import { SystemContext } from '#/common/contexts/system.context';
import { Account } from '#/entities/auth/account.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { ChangePasswordCommand } from '#/modules/auth/commands/change-password.command';
import { ChangePasswordResponseDto } from '#/modules/auth/dto/change-password.response.dto';

@Injectable()
@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand, ChangePasswordResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
    private readonly systemContext: SystemContext,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<ChangePasswordResponseDto> {
    await this.systemContext.validatePassword(command.input.newPassword);

    const userId = this.identifyUserId();
    const account = await this.identifyAccount(userId);
    await this.verifyCurrentPassword(account, command.input.currentPassword);

    const history = this.identifyHistory(account);
    await this.verifyPasswordReuse(history, command.input.newPassword);

    return this.process(userId, account, history, command.input.newPassword);
  }

  private identifyUserId(): string {
    const sessionUser = this.requestContext.request?.session.user;
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    return sessionUser.id;
  }

  private async identifyAccount(userId: string): Promise<Account> {
    const account = await this.em.findOne(Account, {
      user: userId,
      accountId: userId,
      providerId: Account.PROVIDER_CREDENTIAL,
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

    return { ok: true };
  }
}
