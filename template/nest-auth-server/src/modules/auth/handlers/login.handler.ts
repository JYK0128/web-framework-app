import { EntityManager } from '@mikro-orm/core';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { requestContext } from '#/common/context/request-context';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { createSession, CREDENTIAL_PROVIDER, normalizeEmail, toPublicUser } from '#/modules/auth/auth.helpers';
import type { AuthResult } from '#/modules/auth/auth.types';
import { LoginCommand } from '#/modules/auth/commands/login.command';
import { verifyPassword } from '#/modules/auth/password-hasher';

@Injectable()
@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand, AuthResult> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: LoginCommand): Promise<AuthResult> {
    const user = await this.em.findOne(User, { email: normalizeEmail(command.input.email) });
    const account = user
      ? await this.em.findOne(Account, {
        user: user.id,
        accountId: user.id,
        providerId: CREDENTIAL_PROVIDER,
      })
      : null;
    if (!user || !account?.password || !(await verifyPassword(command.input.password, account.password))) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    requestContext.setActorId(user.id);

    return {
      user: toPublicUser(user),
      session: await createSession(this.em, user),
    };
  }
}
