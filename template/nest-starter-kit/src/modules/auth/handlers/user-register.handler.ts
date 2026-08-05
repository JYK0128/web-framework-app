import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { hash } from '@pkg/shared/server';

import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { createCredentialAccount, normalizeEmail } from '#/modules/auth/auth.helpers';
import { UserRegisterCommand } from '#/modules/auth/commands/user-register.command';
import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

@Injectable()
@CommandHandler(UserRegisterCommand)
export class UserRegisterHandler implements ICommandHandler<UserRegisterCommand, UserProfileResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: UserRegisterCommand): Promise<UserProfileResponseDto> {
    const email = normalizeEmail(command.input.email);
    const existingUser = await this.em.findOne(User, { email });
    if (existingUser) {
      throw new ApplicationError({ code: 'EMAIL_ALREADY_REGISTERED', status: HttpStatus.CONFLICT });
    }

    const user = new User();
    user.email = email;
    user.name = command.input.name;
    this.em.persist(user);

    const account = createCredentialAccount(user, await hash(command.input.password, env.BCRYPT_SALT_ROUNDS));
    this.em.persist(account);

    return new UserProfileResponseDto(user);
  }
}
