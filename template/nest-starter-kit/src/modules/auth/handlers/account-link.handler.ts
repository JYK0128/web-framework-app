import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { AccountLinkCommand } from '#/modules/auth/commands/account-link.command';
import { AccountLinkResponseDto } from '#/modules/auth/dto/account-link.response.dto';

@Injectable()
@CommandHandler(AccountLinkCommand)
export class AccountLinkHandler implements ICommandHandler<AccountLinkCommand, AccountLinkResponseDto> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(command: AccountLinkCommand): Promise<AccountLinkResponseDto> {
    const clsUser = this.cls.get('user');
    if (!clsUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const { input } = command;

    const existingAccount = await this.em.findOne(Account, {
      providerId: input.providerId,
      accountId: input.accountId,
    }, { populate: ['user'] });

    if (existingAccount) {
      if (existingAccount.user.id === clsUser.id) {
        if (input.accessToken) existingAccount.accessToken = input.accessToken;
        if (input.refreshToken) existingAccount.refreshToken = input.refreshToken;
        await this.em.flush();
        return { ok: true };
      }
      else {
        throw new ApplicationError({ code: 'ACCOUNT_ALREADY_LINKED', status: HttpStatus.CONFLICT });
      }
    }

    const user = this.em.getReference(User, clsUser.id);

    const newAccount = this.em.create(Account, {
      user,
      providerId: input.providerId,
      accountId: input.accountId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
    });
    this.em.persist(newAccount);

    await this.em.flush();

    return { ok: true };
  }
}
