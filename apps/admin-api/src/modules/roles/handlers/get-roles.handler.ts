import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { User } from '#/core/database/entities/auth';
import { Role } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { RoleItemDto, RoleListResponseDto } from '#/modules/roles/dto';
import { GetRolesQuery } from '#/modules/roles/queries';

@Injectable()
@QueryHandler(GetRolesQuery)
export class GetRolesHandler implements IQueryHandler<GetRolesQuery, RoleListResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<RoleListResponseDto> {
    const roles = await this.em.find(Role, {});
    const items = await Promise.all(roles.map(async (role) => RoleItemDto.from(role, await this.em.count(User, { role: role.id }))));
    return RoleListResponseDto.fromPlain({ items });
  }
}
