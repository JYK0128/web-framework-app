import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AuthPermissionService } from '#/common/security/auth-permission.service';
import { AppEntityManager } from '#/database/entity-manager';
import { Role, type RolePermissions } from '#/entities/auth.extentions/role.entity';
import { UpdateRolePermissionsCommand } from '#/modules/roles/commands/update-role-permissions.command';
import { UpdateRolePermissionsResponseDto } from '#/modules/roles/dto';

@Injectable()
@CommandHandler(UpdateRolePermissionsCommand)
export class UpdateRolePermissionsHandler
implements ICommandHandler<UpdateRolePermissionsCommand, UpdateRolePermissionsResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly authPermissionService: AuthPermissionService,
  ) {}

  async execute(command: UpdateRolePermissionsCommand): Promise<UpdateRolePermissionsResponseDto> {
    const role = await this.identify(command.id);
    return this.process(role, command.input.permissions);
  }

  private async identify(id: string): Promise<Role> {
    const role = await this.em.findOne(Role, { id });
    if (!role) {
      throw new ApplicationError({ code: 'ROLE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return role;
  }

  private async process(role: Role, permissions: RolePermissions): Promise<UpdateRolePermissionsResponseDto> {
    role.permissions = permissions;
    await this.em.flush();
    await this.authPermissionService.invalidatePermissions(role.name);

    return {
      id: role.id,
      name: role.name,
      permissions: role.permissions,
    };
  }
}
