import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { hash } from '@pkg/shared/server';

import { AppEntityManager } from '#/database/entity-manager';
import { RoleName } from '#/entities/auth.extentions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { UserRegisterCommand } from '#/modules/auth/commands/user-register.command';
import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

const CREDENTIAL_PROVIDER = 'credential';

@Injectable()
@CommandHandler(UserRegisterCommand)
export class UserRegisterHandler implements ICommandHandler<UserRegisterCommand, UserProfileResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UserRegisterCommand): Promise<UserProfileResponseDto> {
    const user = await this.identify(command.input.email);
    this.verifyNotExists(user);

    return this.process(command.input.email, command.input.name, command.input.password);
  }

  private async identify(email: string): Promise<User | null> {
    return this.em.findOne(User, { email });
  }

  private verifyNotExists(user: User | null): void {
    if (user) {
      throw new ApplicationError({ code: 'EMAIL_ALREADY_REGISTERED', status: HttpStatus.CONFLICT });
    }
  }

  private async process(email: string, name: string, password: string): Promise<UserProfileResponseDto> {
    const user = new User();
    user.email = email;
    user.name = name;
    user.role = RoleName.USER;
    this.em.persist(user);

    const hashedPassword = await hash(password);
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

    return new UserProfileResponseDto(user);
  }
}
