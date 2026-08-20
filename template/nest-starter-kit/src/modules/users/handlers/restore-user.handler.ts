import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { RestoreUserCommand } from '#/modules/users/commands/restore-user.command';
import { UserDetailDto } from '#/modules/users/dto';

@Injectable()
@CommandHandler(RestoreUserCommand)
export class RestoreUserHandler implements ICommandHandler<RestoreUserCommand, UserDetailDto> {
  constructor(
    private readonly em: AppEntityManager,
  ) {}

  async execute(command: RestoreUserCommand): Promise<UserDetailDto> {
    const user = await this.identifyUser(command.input.id);
    return this.process(user);
  }

  private async identifyUser(id: string): Promise<User> {
    const user = await this.em.findOne(User, { id }, { filters: false });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return user;
  }

  private async process(user: User): Promise<UserDetailDto> {
    if (user.isDeleted) {
      user.deletedAt = null;
      user.deletedBy = null;
    }

    const accounts = await this.em.find(Account, { user: user.id }, { filters: false });
    return new UserDetailDto(user, accounts);
  }
}
