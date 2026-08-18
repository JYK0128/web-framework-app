import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { AuthCacheService } from '#/common/security/auth-cache.service';
import { AppEntityManager } from '#/database/entity-manager';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { UserUnregisterCommand } from '#/modules/auth/commands/user-unregister.command';
import { UserUnregisterResponseDto } from '#/modules/auth/dto/user-unregister.response.dto';
import { GoogleOAuthService } from '#/modules/auth/services';

@Injectable()
@CommandHandler(UserUnregisterCommand)
export class UserUnregisterHandler implements ICommandHandler<UserUnregisterCommand, UserUnregisterResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly authCacheService: AuthCacheService,
    private readonly cls: ClsService,
    private readonly googleOAuthService: GoogleOAuthService,
  ) {}

  async execute(_command: UserUnregisterCommand): Promise<UserUnregisterResponseDto> {
    const user = await this.identifyUser();
    const accounts = user ? await this.identifyAccounts(user.id) : [];

    return this.process(user, accounts);
  }

  private async identifyUser(): Promise<User | null> {
    const sessionUser = this.cls.get('user');
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    return this.em.findOne(User, { id: sessionUser.id });
  }

  private async identifyAccounts(userId: string): Promise<Account[]> {
    return this.em.find(Account, { user: userId });
  }

  private async process(user: User | null, accounts: Account[]): Promise<UserUnregisterResponseDto> {
    if (user) {
      await Promise.allSettled(accounts.map((account) => this.googleOAuthService.revokeAccount(account)));
      await this.em.nativeDelete(User, { id: user.id });
      await this.authCacheService.invalidateUserState(user.id);
    }

    return { ok: true };
  }
}
