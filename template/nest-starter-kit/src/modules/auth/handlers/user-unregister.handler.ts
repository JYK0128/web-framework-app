import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { OAuthService } from '#/infra/oauth';
import { UserUnregisterCommand } from '#/modules/auth/commands/user-unregister.command';
import { UserUnregisterResponseDto } from '#/modules/auth/dto/user-unregister.response.dto';

@Injectable()
@CommandHandler(UserUnregisterCommand)
export class UserUnregisterHandler implements ICommandHandler<UserUnregisterCommand, UserUnregisterResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
    private readonly oauthService: OAuthService,
  ) {}

  async execute(_command: UserUnregisterCommand): Promise<UserUnregisterResponseDto> {
    const userId = this.identifyUserId();
    const accounts = await this.identifyAccounts(userId);

    return this.process(userId, accounts);
  }

  private identifyUserId(): string {
    const sessionUser = this.requestContext.request?.session.user;
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    return sessionUser.id;
  }

  private async identifyAccounts(userId: string): Promise<Account[]> {
    return this.em.find(Account, { user: userId });
  }

  private async process(userId: string, accounts: Account[]): Promise<UserUnregisterResponseDto> {
    await Promise.allSettled(accounts.map((account) => this.oauthService.revokeAccount(account)));
    await this.em.nativeDelete(User, { id: userId });

    return { ok: true };
  }
}
