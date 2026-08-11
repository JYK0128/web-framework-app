import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Account } from '#/entities/auth/account.entity';
import { ROLE_NAMES } from '#/entities/auth/role.entity';
import { User } from '#/entities/auth/user.entity';
import { LoginOAuthCommand } from '#/modules/auth/commands/login-oauth.command';
import type { LoginOAuthResponseDto } from '#/modules/auth/dto/login-oauth.response.dto';
import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

@Injectable()
@CommandHandler(LoginOAuthCommand)
export class LoginOAuthHandler implements ICommandHandler<LoginOAuthCommand, LoginOAuthResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: LoginOAuthCommand): Promise<LoginOAuthResponseDto> {
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
      return { user: new UserProfileResponseDto(account.user) };
    }

    let user = await this.em.findOne(User, { email });

    if (user?.isBanned) {
      throw new ApplicationError({ code: 'USER_BANNED', status: HttpStatus.FORBIDDEN });
    }

    if (!user) {
      user = this.em.create(User, {
        email,
        name: input.name,
        role: ROLE_NAMES.ADMIN,
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

    return { user: new UserProfileResponseDto(user) };
  }
}
