import { EntityManager } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { normalizeEmail } from '#/modules/auth/auth.helpers';
import { OAuthLoginCommand } from '#/modules/auth/commands/oauth-login.command';
import { CurrentUserResponseDto } from '#/modules/auth/dto/current-user.response.dto';

@Injectable()
@CommandHandler(OAuthLoginCommand)
export class OAuthLoginHandler implements ICommandHandler<OAuthLoginCommand, CurrentUserResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: OAuthLoginCommand): Promise<CurrentUserResponseDto> {
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
      return new CurrentUserResponseDto(account.user);
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

    return new CurrentUserResponseDto(user);
  }
}
