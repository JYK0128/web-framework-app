import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Role, type RolePermissions } from '#/entities/auth.extentions/role.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UpdateRolePermissionsCommand } from '#/modules/roles/commands/update-role-permissions.command';
import { UpdateRolePermissionsResponseDto } from '#/modules/roles/dto';

@Injectable()
@CommandHandler(UpdateRolePermissionsCommand)
export class UpdateRolePermissionsHandler
implements ICommandHandler<UpdateRolePermissionsCommand, UpdateRolePermissionsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateRolePermissionsCommand): Promise<UpdateRolePermissionsResponseDto> {
    const role = await this.identifyRole(command.input.id);
    return this.process(role, command.input.input);
  }

  private async identifyRole(id: string): Promise<Role> {
    const role = await this.em.findOne(Role, { id });
    if (!role) {
      throw new ApplicationError({ code: 'ROLE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return role;
  }

  private process(
    role: Role,
    input: { label?: string, description?: string, permissions?: RolePermissions },
  ): UpdateRolePermissionsResponseDto {
    if (input.label !== undefined) {
      role.label = input.label;
    }
    if (input.description !== undefined) {
      role.description = input.description;
    }
    if (input.permissions !== undefined) {
      role.permissions = input.permissions;
    }

    return new UpdateRolePermissionsResponseDto(role);
  }
}
