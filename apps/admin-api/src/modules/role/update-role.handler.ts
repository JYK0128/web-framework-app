import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { type IUserAuthService, USER_AUTH_SERVICE } from '@pkg/server-core/auth/user/user-auth.interface';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/core/database/entities/auth';
import { Role } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { UpdateRoleCommand } from '#/modules/role/update-role.command';
import { UpdateRoleResponseDto } from '#/modules/role/update-role.response.dto';

import { normalizePermissions } from './create-role.handler';

@Injectable()
@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand, UpdateRoleResponseDto> {
  constructor(private readonly em: AppEntityManager, @Inject(USER_AUTH_SERVICE) private readonly userAuthService: IUserAuthService) {}

  async execute(command: UpdateRoleCommand): Promise<UpdateRoleResponseDto> {
    const role = await this.em.findOne(Role, { id: command.input.roleId }, { filters: false });
    if (!role || role.deletedAt) throw new ApplicationError({ code: 'ROLE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    const input = command.input.input;
    if (input.label !== undefined) role.label = input.label.trim();
    if (input.description !== undefined) role.description = input.description.trim() || null;
    role.updatedAt = new Date();
    if (input.permissions !== undefined) {
      role.permissions = await normalizePermissions(this.em, input.permissions);
      await this.em.flush();
      await this.userAuthService.invalidateRoleTokens?.(role.id);
    }
    return UpdateRoleResponseDto.parseEntity(role, await this.em.count(User, { role: role.id }));
  }
}
