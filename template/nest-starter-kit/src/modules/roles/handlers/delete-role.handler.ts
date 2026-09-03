import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Role } from '#/entities/auth.extentions/role.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DeleteRoleCommand } from '#/modules/roles/commands/delete-role.command';
import { DeleteRoleResponseDto } from '#/modules/roles/dto';

@Injectable()
@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand, DeleteRoleResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteRoleCommand): Promise<DeleteRoleResponseDto> {
    const role = await this.identifyRole(command.input.id);
    await this.verifyDeletable(role);
    return this.process(role);
  }

  private async identifyRole(id: string): Promise<Role> {
    const role = await this.em.findOne(Role, { id });
    if (!role) {
      throw new ApplicationError({ code: 'ROLE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return role;
  }

  private async verifyDeletable(role: Role): Promise<void> {
    if (role.isSystem) {
      throw new ApplicationError({
        code: 'CANNOT_DELETE_SYSTEM_ROLE',
        message: '시스템 기본 역할은 삭제할 수 없습니다.',
        status: HttpStatus.FORBIDDEN,
      });
    }

    const assignedUserCount = await this.em.count(User, { role: role.name });
    if (assignedUserCount > 0) {
      throw new ApplicationError({
        code: 'ROLE_IN_USE',
        message: `해당 역할을 사용 중인 회원이 ${assignedUserCount}명 있어 삭제할 수 없습니다.`,
        status: HttpStatus.CONFLICT,
      });
    }
  }

  private process(role: Role): DeleteRoleResponseDto {
    const id = role.id;
    const name = role.name;
    this.em.remove(role);
    return new DeleteRoleResponseDto(id, name);
  }
}
