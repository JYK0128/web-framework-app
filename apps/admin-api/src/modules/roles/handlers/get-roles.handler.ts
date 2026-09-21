import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Role } from '#/entities/auth.extensions/role.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetRolesResponseDto, RoleItemDto } from '#/modules/roles/interfaces';
import { GetRolesQuery } from '#/modules/roles/queries';

@Injectable()
@QueryHandler(GetRolesQuery)
export class GetRolesHandler implements IQueryHandler<GetRolesQuery, GetRolesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<GetRolesResponseDto> {
    const roles = await this.em.find(Role, {});
    const items = await Promise.all(roles.map(async (role) => RoleItemDto.from(role, await this.em.count(User, { role: role.id }))));
    return GetRolesResponseDto.fromPlain({ items });
  }
}
