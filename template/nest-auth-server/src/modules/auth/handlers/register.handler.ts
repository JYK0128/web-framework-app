import { EntityManager } from '@mikro-orm/core';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { requestContext } from '#/common/context/request-context';
import { User } from '#/entities/auth/user.entity';
import { createCredentialAccount, createSession, normalizeEmail, toPublicUser } from '#/modules/auth/auth.helpers';
import type { AuthResult } from '#/modules/auth/auth.types';
import { RegisterCommand } from '#/modules/auth/commands/register.command';
import { hashPassword } from '#/modules/auth/password-hasher';

@Injectable()
@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand, AuthResult> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: RegisterCommand): Promise<AuthResult> {
    const email = normalizeEmail(command.input.email);
    const existingUser = await this.em.findOne(User, { email });
    if (existingUser) {
      throw new ConflictException({ code: 'EMAIL_ALREADY_REGISTERED', message: 'Email is already registered' });
    }

    const user = new User();
    user.email = email;
    user.name = command.input.name;
    requestContext.setActorId(user.id);
    this.em.persist(user);

    const account = createCredentialAccount(user, await hashPassword(command.input.password));
    this.em.persist(account);

    return {
      user: toPublicUser(user),
      session: await createSession(this.em, user),
    };
  }
}
