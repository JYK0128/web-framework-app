import { EntityManager } from '@mikro-orm/core';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { hash } from '@pkg/shared/server';

import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { createCredentialAccount, normalizeEmail } from '#/modules/auth/auth.helpers';
import { RegisterCommand } from '#/modules/auth/commands/register.command';
import { CurrentUserResponseDto } from '#/modules/auth/dto/current-user.response.dto';

@Injectable()
@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand, CurrentUserResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: RegisterCommand): Promise<CurrentUserResponseDto> {
    const email = normalizeEmail(command.input.email);
    const existingUser = await this.em.findOne(User, { email });
    if (existingUser) {
      throw new ConflictException({ code: 'EMAIL_ALREADY_REGISTERED', message: 'Email is already registered' });
    }

    const user = new User();
    user.email = email;
    user.name = command.input.name;
    this.em.persist(user);

    const account = createCredentialAccount(user, await hash(command.input.password, env.BCRYPT_SALT_ROUNDS));
    this.em.persist(account);

    return new CurrentUserResponseDto(user);
  }
}
