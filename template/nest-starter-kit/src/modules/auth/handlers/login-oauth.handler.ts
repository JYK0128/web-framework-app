import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { ROLE_NAMES } from '#/entities/auth.extentions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { LoginOAuthCommand } from '#/modules/auth/commands/login-oauth.command';
import { LoginOAuthOutputDto } from '#/modules/auth/dto/login-oauth.output.dto';

@Injectable()
@CommandHandler(LoginOAuthCommand)
export class LoginOAuthHandler implements ICommandHandler<LoginOAuthCommand, LoginOAuthOutputDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: LoginOAuthCommand): Promise<LoginOAuthOutputDto> {
    const { input } = command;
    const { email } = input;

    let account = await this.em.findOne(Account, {
      providerId: input.provider,
      accountId: input.accountId,
    }, { populate: ['user'] });

    if (account) {
      if (account.user.isBanned) {
        throw new ApplicationError({ code: 'USER_BANNED', status: HttpStatus.FORBIDDEN });
      }
      if (input.accessToken) account.accessToken = input.accessToken;
      if (input.refreshToken) account.refreshToken = input.refreshToken;
      await this.em.flush();
      return {
        userId: account.user.id,
        twoFactorEnabled: account.user.twoFactorEnabled,
      };
    }

    let user = await this.em.findOne(User, { email });

    if (user?.isBanned) {
      throw new ApplicationError({ code: 'USER_BANNED', status: HttpStatus.FORBIDDEN });
    }

    if (!user) {
      user = this.em.create(User, {
        email,
        name: input.name,
        role: ROLE_NAMES.USER,
      });
      this.em.persist(user);
    }

    account = this.em.create(Account, {
      user,
      providerId: input.provider,
      accountId: input.accountId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
    });
    this.em.persist(account);

    await this.em.flush();

    return {
      userId: user.id,
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }
}
