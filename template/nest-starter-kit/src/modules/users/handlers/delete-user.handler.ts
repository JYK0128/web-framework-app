import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionStore } from '#/common/stores/session.store';
import { AppEntityManager } from '#/database/entity-manager';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { DeleteUserCommand } from '#/modules/users/commands/delete-user.command';
import { UserDetailDto } from '#/modules/users/dto';

@Injectable()
@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand, UserDetailDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionStore: SessionStore,
  ) {}

  async execute(command: DeleteUserCommand): Promise<UserDetailDto> {
    const user = await this.identifyUser(command.id);
    this.verifyNotSelf(user, command.currentUserId);

    return this.process(user, command.currentUserId);
  }

  private async identifyUser(id: string): Promise<User> {
    const user = await this.em.findOne(User, { id }, { filters: false });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return user;
  }

  private verifyNotSelf(user: User, currentUserId: string): void {
    if (user.id === currentUserId) {
      throw new ApplicationError({ code: 'USER_SELF_ACTION_NOT_ALLOWED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async process(user: User, currentUserId: string): Promise<UserDetailDto> {
    if (!user.isDeleted) {
      user.deletedAt = new Date();
      user.deletedBy = currentUserId;
      await this.sessionStore.destroyAll(user.id);
    }

    const accounts = await this.em.find(Account, { user: user.id }, { filters: false });
    return new UserDetailDto(user, accounts);
  }
}
