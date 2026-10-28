import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { User } from '~/core/database/entities/auth';
import { Role } from '~/core/database/entities/auth.extensions';
import { GetRolesQuery } from '~/modules/role/get-roles.query';
import { GetRolesResponseDto } from '~/modules/role/get-roles.response.dto';
import { RoleItemDto } from '~/modules/role/role-item.dto';

@Injectable()
@QueryHandler(GetRolesQuery)
export class GetRolesHandler implements IQueryHandler<GetRolesQuery, GetRolesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<GetRolesResponseDto> {
    const roles = await this.em.find(Role, {});
    const items = await Promise.all(roles.map(async (role) => RoleItemDto.parseEntity(role, await this.em.count(User, { role: role.id }))));
    return GetRolesResponseDto.parse({ items });
  }
}
