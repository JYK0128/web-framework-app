import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Role } from '#/entities/auth.extensions/role.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UpdateRoleCommand } from '#/modules/roles/commands';
import { RoleItemDto, UpdateRoleResponseDto } from '#/modules/roles/interfaces';

import { normalizePermissions } from './create-role.handler';

@Injectable()
@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand, UpdateRoleResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateRoleCommand): Promise<UpdateRoleResponseDto> {
    const role = await this.em.findOne(Role, { id: command.input.roleId }, { filters: false });
    if (!role || role.deletedAt) throw new ApplicationError({ code: 'ROLE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    const input = command.input.input;
    if (input.label !== undefined) role.label = input.label.trim();
    if (input.description !== undefined) role.description = input.description.trim() || null;
    if (input.permissions !== undefined) role.permissions = await normalizePermissions(this.em, input.permissions);
    role.updatedAt = new Date();
    return RoleItemDto.from(role, await this.em.count(User, { role: role.id }));
  }
}
