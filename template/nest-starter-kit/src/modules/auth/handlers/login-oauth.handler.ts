import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { RoleName } from '#/entities/auth.extentions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { LoginOAuthCommand } from '#/modules/auth/commands/login-oauth.command';
import { LoginOAuthOutputDto } from '#/modules/auth/dto/login-oauth.output.dto';

@Injectable()
@CommandHandler(LoginOAuthCommand)
export class LoginOAuthHandler implements ICommandHandler<LoginOAuthCommand, LoginOAuthOutputDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: LoginOAuthCommand): Promise<LoginOAuthOutputDto> {
    const account = await this.identifyAccount(command.input.provider, command.input.accountId);

    if (account) {
      this.verifyNotBanned(account.user);
      return this.processUpdate(account, command.input);
    }

    const user = await this.identifyUser(command.input.email);
    if (user) {
      this.verifyNotBanned(user);
    }

    return this.processCreate(user, command.input);
  }

  private async identifyAccount(provider: string, accountId: string): Promise<Account | null> {
    return this.em.findOne(Account, {
      providerId: provider,
      accountId,
    }, { populate: ['user'] });
  }

  private async identifyUser(email: string): Promise<User | null> {
    return this.em.findOne(User, { email });
  }

  private verifyNotBanned(user: User): void {
    if (user.isBanned) {
      throw new ApplicationError({ code: 'USER_BANNED', status: HttpStatus.FORBIDDEN });
    }
  }

  private async processUpdate(account: Account, input: LoginOAuthCommand['input']): Promise<LoginOAuthOutputDto> {
    if (input.accessToken) account.accessToken = input.accessToken;
    if (input.refreshToken) account.refreshToken = input.refreshToken;

    return {
      userId: account.user.id,
      twoFactorEnabled: account.user.twoFactorEnabled,
    };
  }

  private async processCreate(
    existingUser: User | null,
    input: LoginOAuthCommand['input'],
  ): Promise<LoginOAuthOutputDto> {
    let user = existingUser;

    if (!user) {
      user = this.em.create(User, {
        email: input.email,
        name: input.name,
        role: RoleName.USER,
      });
      this.em.persist(user);
    }

    const account = this.em.create(Account, {
      user,
      providerId: input.provider,
      accountId: input.accountId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
    });
    this.em.persist(account);

    return {
      userId: user.id,
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }
}
