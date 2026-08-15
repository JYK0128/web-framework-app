import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { AppEntityManager } from '#/database/entity-manager';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { AccountLinkCommand } from '#/modules/auth/commands/account-link.command';
import { AccountLinkResponseDto } from '#/modules/auth/dto/account-link.response.dto';

@Injectable()
@CommandHandler(AccountLinkCommand)
export class AccountLinkHandler implements ICommandHandler<AccountLinkCommand, AccountLinkResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(command: AccountLinkCommand): Promise<AccountLinkResponseDto> {
    const userId = this.identifyUserId();
    const account = await this.identifyAccount(command.input.providerId, command.input.accountId);
    this.verifyOwnership(account, userId);

    return this.process(userId, account, command.input);
  }

  private identifyUserId(): string {
    const sessionUser = this.cls.get('user');
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    return sessionUser.id;
  }

  private async identifyAccount(providerId: string, accountId: string): Promise<Account | null> {
    return this.em.findOne(Account, {
      providerId,
      accountId,
    }, { populate: ['user'] });
  }

  private verifyOwnership(account: Account | null, userId: string): void {
    if (account && account.user.id !== userId) {
      throw new ApplicationError({ code: 'ACCOUNT_ALREADY_LINKED', status: HttpStatus.CONFLICT });
    }
  }

  private async process(
    userId: string,
    account: Account | null,
    input: AccountLinkCommand['input'],
  ): Promise<AccountLinkResponseDto> {
    if (account) {
      if (input.accessToken) account.accessToken = input.accessToken;
      if (input.refreshToken) account.refreshToken = input.refreshToken;
    }
    else {
      const user = this.em.getReference(User, userId);
      const newAccount = this.em.create(Account, {
        user,
        providerId: input.providerId,
        accountId: input.accountId,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
      });
      this.em.persist(newAccount);
    }

    return { ok: true };
  }
}
