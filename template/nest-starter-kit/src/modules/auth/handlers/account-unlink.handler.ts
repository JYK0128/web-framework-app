import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { type AuthProvider } from '#/common/constants/auth.constants';
import { RequestContext } from '#/common/contexts/request.context';
import { Account } from '#/entities/auth/account.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { OAuthService } from '#/infra/oauth';
import { AccountUnlinkCommand } from '#/modules/auth/commands/account-unlink.command';
import { AccountUnlinkResponseDto } from '#/modules/auth/dto/account-unlink.response.dto';

@Injectable()
@CommandHandler(AccountUnlinkCommand)
export class AccountUnlinkHandler implements ICommandHandler<AccountUnlinkCommand, AccountUnlinkResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
    private readonly oauthService: OAuthService,
  ) {}

  async execute(command: AccountUnlinkCommand): Promise<AccountUnlinkResponseDto> {
    const userId = this.identifyUserId();
    const accountCount = await this.identifyAccountCount(userId);
    this.verifyRemovable(accountCount);

    const account = await this.identifyAccount(userId, command.input.providerId, command.input.accountId);
    return this.process(account);
  }

  private identifyUserId(): string {
    const sessionUser = this.requestContext.request?.session.user;
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    return sessionUser.id;
  }

  private async identifyAccountCount(userId: string): Promise<number> {
    return this.em.count(Account, { user: userId });
  }

  private verifyRemovable(accountCount: number): void {
    if (accountCount <= 1) {
      throw new ApplicationError({ code: 'CANNOT_UNLINK_LAST_ACCOUNT', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async identifyAccount(userId: string, providerId: AuthProvider, accountId: string): Promise<Account> {
    const account = await this.em.findOne(Account, {
      user: userId,
      providerId,
      accountId,
    });
    if (!account) {
      throw new ApplicationError({ code: 'ACCOUNT_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return account;
  }

  private async process(account: Account): Promise<AccountUnlinkResponseDto> {
    await this.oauthService.revokeAccount(account);
    this.em.remove(account);

    return { ok: true };
  }
}
