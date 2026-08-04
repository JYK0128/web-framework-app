import { EntityManager } from '@mikro-orm/core';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { verify } from '@pkg/shared/server';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { CREDENTIAL_PROVIDER, normalizeEmail } from '#/modules/auth/auth.helpers';
import { LoginCommand } from '#/modules/auth/commands/login.command';
import { CurrentUserResponseDto } from '#/modules/auth/dto/current-user.response.dto';

@Injectable()
@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand, CurrentUserResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: LoginCommand): Promise<CurrentUserResponseDto> {
    const user = await this.em.findOne(User, { email: normalizeEmail(command.input.email) });
    const account = user
      ? await this.em.findOne(Account, {
        user: user.id,
        accountId: user.id,
        providerId: CREDENTIAL_PROVIDER,
      })
      : null;
    if (!user || !account?.password || !(await verify(command.input.password, account.password))) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    return new CurrentUserResponseDto(user);
  }
}
