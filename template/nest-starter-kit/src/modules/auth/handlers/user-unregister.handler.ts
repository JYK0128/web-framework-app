import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
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
    private readonly sessionContext: SessionContext,
    private readonly oauthService: OAuthService,
  ) {}

  async execute(_command: UserUnregisterCommand): Promise<UserUnregisterResponseDto> {
    const userId = this.sessionContext.requiredUser.id;
    const accounts = await this.identifyAccounts(userId);
    this.verify(userId, accounts);

    return this.process(userId, accounts);
  }

  private verify(userId: string, accounts: Account[]): void {
    if (!userId || !Array.isArray(accounts)) {
      throw new ApplicationError({ code: 'ACCOUNT_UNREGISTER_UNAVAILABLE', status: HttpStatus.BAD_REQUEST });
    }
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
