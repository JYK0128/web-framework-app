import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { hash, verify } from '@pkg/shared/server';

import { SessionContext } from '#/common/contexts/session.context';
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
    private readonly systemContext: SystemContext,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<ChangePasswordResponseDto> {
    const policy = await this.systemContext.getAuthPolicy();
    const userId = this.sessionContext.requiredUser.id;
    const account = await this.identifyAccount(userId);
    const history = (account.metadata?.passwordHistory ?? []).slice(0, policy.historyLimit);
    await this.verify(account, history, command.input.currentPassword, command.input.newPassword, policy);

    return this.process(userId, account, history, command.input.newPassword, policy.historyLimit);
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

  private async verify(
    account: Account,
    history: string[],
    currentPassword: string,
    newPassword: string,
    policy: Awaited<ReturnType<SystemContext['getAuthPolicy']>>,
  ): Promise<void> {
    await this.systemContext.validatePassword(newPassword, policy);
    await this.verifyCurrentPassword(account, currentPassword);
    await this.verifyPasswordReuse(history, newPassword);
  }

  private async process(
    userId: string,
    account: Account,
    history: string[],
    newPassword: string,
    historyLimit: number,
  ): Promise<ChangePasswordResponseDto> {
    const newHashedPassword = await hash(newPassword);
    const updatedHistory = [newHashedPassword, ...history].slice(0, Math.max(0, historyLimit));

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
