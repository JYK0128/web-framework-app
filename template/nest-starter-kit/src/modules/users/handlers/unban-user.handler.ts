import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UnbanUserCommand } from '#/modules/users/commands/unban-user.command';
import { UnbanUserResponseDto } from '#/modules/users/dto';

@Injectable()
@CommandHandler(UnbanUserCommand)
export class UnbanUserHandler implements ICommandHandler<UnbanUserCommand, UnbanUserResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
  ) {}

  async execute(command: UnbanUserCommand): Promise<UnbanUserResponseDto> {
    const user = await this.identifyUser(command.input.id);
    this.verifyEligibility(user, command.input.currentUserId);

    return this.process(user);
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

  private process(user: User): UnbanUserResponseDto {
    user.banned = false;
    user.banReason = null;
    user.banExpires = null;

    return { ok: true };
  }
}
