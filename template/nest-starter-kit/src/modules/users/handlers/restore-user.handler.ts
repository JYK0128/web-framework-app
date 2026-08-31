import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { RestoreUserCommand } from '#/modules/users/commands/restore-user.command';
import { RestoreUserResponseDto } from '#/modules/users/dto';

@Injectable()
@CommandHandler(RestoreUserCommand)
export class RestoreUserHandler implements ICommandHandler<RestoreUserCommand, RestoreUserResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
  ) {}

  async execute(command: RestoreUserCommand): Promise<RestoreUserResponseDto> {
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

  private process(user: User): RestoreUserResponseDto {
    if (user.isDeleted) {
      user.deletedAt = null;
      user.deletedBy = null;
    }

    return { ok: true };
  }
}
