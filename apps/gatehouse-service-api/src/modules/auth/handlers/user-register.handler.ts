import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { hash } from '@pkg/shared/server';

import { Account } from '#/entities/auth/account.entity';
import { ROLE_NAMES } from '#/entities/auth/role.entity';
import { User } from '#/entities/auth/user.entity';
import { UserRegisterCommand } from '#/modules/auth/commands/user-register.command';
import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

const CREDENTIAL_PROVIDER = 'credential';

@Injectable()
@CommandHandler(UserRegisterCommand)
export class UserRegisterHandler implements ICommandHandler<UserRegisterCommand, UserProfileResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: UserRegisterCommand): Promise<UserProfileResponseDto> {
    const { email } = command.input;
    const existingUser = await this.em.findOne(User, { email });
    if (existingUser) {
      throw new ApplicationError({ code: 'EMAIL_ALREADY_REGISTERED', status: HttpStatus.CONFLICT });
    }

    const user = new User();
    user.email = email;
    user.name = command.input.name;
    user.role = ROLE_NAMES.USER;
    this.em.persist(user);

    const hashedPassword = await hash(command.input.password);
    const account = this.em.create(Account, {
      user,
      accountId: user.id,
      providerId: CREDENTIAL_PROVIDER,
      password: hashedPassword,
      metadata: {
        passwordUpdatedAt: new Date(),
        passwordHistory: [hashedPassword],
      },
    });
    this.em.persist(account);

    await this.em.flush();

    return new UserProfileResponseDto(user);
  }
}
