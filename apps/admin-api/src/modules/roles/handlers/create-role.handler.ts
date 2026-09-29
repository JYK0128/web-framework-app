import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Permission as PermissionEntity } from '#/entities/auth.extensions/permission.entity';
import { Role } from '#/entities/auth.extensions/role.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CreateRoleCommand } from '#/modules/roles/commands';
import { CreateRoleResponseDto, RoleItemDto } from '#/modules/roles/interfaces';

@Injectable()
@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand, CreateRoleResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: CreateRoleCommand): Promise<CreateRoleResponseDto> {
    const input = command.input;
    const code = input.code.trim().toLowerCase();
    if (await this.em.findOne(Role, { code }, { filters: false })) {
      throw new ApplicationError({ code: 'ROLE_CODE_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    }
    const role = this.em.create(Role, { code, label: input.label.trim(), description: input.description?.trim() || null, permissions: await normalizePermissions(this.em, input.permissions), isSystem: false });
    this.em.persist(role);
    return RoleItemDto.from(role, 0);
  }
}

export async function normalizePermissions(em: AppEntityManager, permissions?: string[]): Promise<string[]> {
  const normalized = [...new Set((permissions ?? []).map((permission) => permission.trim().toLowerCase()).filter(Boolean))];
  if (normalized.length === 0) return [];

  const storedPermissions = await em.find(
    PermissionEntity,
    { code: { $in: normalized }, deletedAt: null },
    { filters: false },
  );
  const storedCodes = new Set(storedPermissions.map((permission) => permission.code));
  const invalidPermissions = normalized.filter((permission) => !storedCodes.has(permission));

  if (invalidPermissions.length > 0) {
    throw new ApplicationError({
      code: 'ROLE_PERMISSIONS_INVALID',
      status: HttpStatus.BAD_REQUEST,
      details: { permissions: invalidPermissions },
    });
  }

  return normalized;
}
