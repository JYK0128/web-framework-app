import { EntityManager } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { normalizeEmail } from '#/modules/auth/auth.helpers';
import { LoginOAuthCommand } from '#/modules/auth/commands/login-oauth.command';
import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

@Injectable()
@CommandHandler(LoginOAuthCommand)
export class LoginOAuthHandler implements ICommandHandler<LoginOAuthCommand, UserProfileResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: LoginOAuthCommand): Promise<UserProfileResponseDto> {
    const { input } = command;
    const email = normalizeEmail(input.email);

    let account = await this.em.findOne(Account, {
      providerId: input.provider,
      accountId: input.accountId,
    }, { populate: ['user'] });

    if (account) {
      if (input.accessToken) account.accessToken = input.accessToken;
      if (input.refreshToken) account.refreshToken = input.refreshToken;
      await this.em.flush();
      return new UserProfileResponseDto(account.user);
    }

    let user = await this.em.findOne(User, { email });

    if (!user) {
      user = this.em.create(User, {
        email,
        name: input.name,
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

    return new UserProfileResponseDto(user);
  }
}
