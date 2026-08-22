import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionStore } from '#/common/stores/session.store';
import { RoleName } from '#/entities/auth.extentions/role.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UpdateUserRoleCommand } from '#/modules/users/commands/update-user-role.command';
import { UpdateUserRoleResponseDto } from '#/modules/users/dto';

@Injectable()
@CommandHandler(UpdateUserRoleCommand)
export class UpdateUserRoleHandler implements ICommandHandler<UpdateUserRoleCommand, UpdateUserRoleResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionStore: SessionStore,
  ) {}

  async execute(command: UpdateUserRoleCommand): Promise<UpdateUserRoleResponseDto> {
    const user = await this.identifyUser(command.input.id);
    this.verifyEligibility(user, command.input.currentUserId);

    return this.process(user, command.input.role);
  }

  private async identifyUser(id: string): Promise<User> {
    const user = await this.em.findOne(User, { id }, { filters: false });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return user;
  }

  private verifyEligibility(user: User, currentUserId: string): void {
    if (user.id === currentUserId) {
      throw new ApplicationError({ code: 'USER_SELF_ACTION_NOT_ALLOWED', status: HttpStatus.BAD_REQUEST });
    }
    if (user.isDeleted) {
      throw new ApplicationError({ code: 'USER_DELETED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async process(user: User, role: RoleName): Promise<UpdateUserRoleResponseDto> {
    user.role = role;
    await this.sessionStore.destroyAll(user.id);

    return { ok: true };
  }
}
