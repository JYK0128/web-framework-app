import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { Account } from '#/entities/auth/account.entity';
import { AccountUnlinkCommand } from '#/modules/auth/commands/account-unlink.command';
import { AccountUnlinkResponseDto } from '#/modules/auth/dto/account-unlink.response.dto';

@Injectable()
@CommandHandler(AccountUnlinkCommand)
export class AccountUnlinkHandler implements ICommandHandler<AccountUnlinkCommand, AccountUnlinkResponseDto> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(command: AccountUnlinkCommand): Promise<AccountUnlinkResponseDto> {
    const clsUser = this.cls.get('user');
    if (!clsUser) {
      throw new ApplicationError({ code: 'UNAUTHORIZED', status: HttpStatus.BAD_REQUEST });
    }

    const { input } = command;

    const accountCount = await this.em.count(Account, { user: clsUser.id });
    if (accountCount <= 1) {
      throw new ApplicationError({ code: 'CANNOT_UNLINK_LAST_ACCOUNT', status: HttpStatus.BAD_REQUEST });
    }

    const account = await this.em.findOne(Account, {
      user: clsUser.id,
      providerId: input.providerId,
      accountId: input.accountId,
    });

    if (!account) {
      throw new ApplicationError({ code: 'ACCOUNT_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    this.em.remove(account);
    await this.em.flush();

    return { ok: true };
  }
}
