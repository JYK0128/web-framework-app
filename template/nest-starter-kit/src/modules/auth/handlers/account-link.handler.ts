import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { type OAuthProvider, OAuthService } from '#/infra/oauth';
import { AccountLinkCommand } from '#/modules/auth/commands/account-link.command';
import { AccountLinkResponseDto } from '#/modules/auth/dto/account-link.response.dto';

@Injectable()
@CommandHandler(AccountLinkCommand)
export class AccountLinkHandler implements ICommandHandler<AccountLinkCommand, AccountLinkResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
    private readonly oauthService: OAuthService,
  ) {}

  async execute(command: AccountLinkCommand): Promise<AccountLinkResponseDto> {
    const userId = this.identifyUserId();
    await this.verifyExternalAccount(command.input);
    const account = await this.identifyAccount(command.input.providerId, command.input.accountId);
    this.verifyOwnership(account, userId);

    return this.process(userId, account, command.input);
  }

  private async verifyExternalAccount(input: AccountLinkCommand['input']): Promise<void> {
    if (!input.accessToken) {
      throw new ApplicationError({ code: 'ACCOUNT_LINK_VERIFICATION_REQUIRED', status: HttpStatus.BAD_REQUEST });
    }

    const profile = await this.oauthService.fetchProfile(input.providerId, input.accessToken);
    if (!profile || profile.id !== input.accountId) {
      throw new ApplicationError({ code: 'INVALID_EXTERNAL_ACCOUNT', status: HttpStatus.BAD_REQUEST });
    }
  }

  private identifyUserId(): string {
    const sessionUser = this.requestContext.request?.session.user;
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    return sessionUser.id;
  }

  private async identifyAccount(providerId: OAuthProvider, accountId: string): Promise<Account | null> {
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
    await this.em.flush();

    return { ok: true };
  }
}
