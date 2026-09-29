import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Role } from '#/entities/auth.extensions/role.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DeleteRoleCommand } from '#/modules/roles/commands';
import { DeleteRoleResponseDto } from '#/modules/roles/interfaces';

@Injectable()
@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand, DeleteRoleResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteRoleCommand): Promise<DeleteRoleResponseDto> {
    const role = await this.em.findOne(Role, { id: command.input.roleId }, { filters: false });
    if (!role || role.deletedAt) throw new ApplicationError({ code: 'ROLE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    if (role.isSystem) throw new ApplicationError({ code: 'SYSTEM_ROLE_CANNOT_BE_DELETED', status: HttpStatus.CONFLICT });
    if (await this.em.count(User, { role: role.id, deletedAt: null }, { filters: false })) {
      throw new ApplicationError({ code: 'ROLE_IN_USE', status: HttpStatus.CONFLICT, message: '사용 중인 역할은 삭제할 수 없습니다.' });
    }
    role.deletedAt = new Date();
    return { id: role.id, deleted: true };
  }
}
