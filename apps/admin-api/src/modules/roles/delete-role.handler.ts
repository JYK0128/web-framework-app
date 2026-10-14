import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/core/database/entities/auth';
import { Role } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { DeleteRoleCommand } from '#/modules/roles/delete-role.command';
import { DeleteRoleResponseDto } from '#/modules/roles/delete-role.response.dto';

@Injectable()
@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand, DeleteRoleResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteRoleCommand): Promise<DeleteRoleResponseDto> {
    const role = await this.em.findOne(Role, { id: command.input.roleId }, { filters: false });
    if (!role || role.deletedAt) throw new ApplicationError({ code: 'ROLE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    if (role.isSystem) throw new ApplicationError({ code: 'SYSTEM_ROLE_CANNOT_BE_DELETED', status: HttpStatus.CONFLICT });
    if (await this.em.count(User, { role: role.id, deletedAt: null }, { filters: false })) {
      throw new ApplicationError({ code: 'ROLE_IN_USE', status: HttpStatus.CONFLICT });
    }
    role.deletedAt = new Date();
    return DeleteRoleResponseDto.parseEntity(role);
  }
}
