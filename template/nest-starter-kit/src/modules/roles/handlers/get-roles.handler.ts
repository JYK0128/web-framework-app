import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Role } from '#/entities/auth.extentions/role.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetRolesResponseDto, RoleDto } from '#/modules/roles/dto';
import { GetRolesQuery } from '#/modules/roles/queries/get-roles.query';

@Injectable()
@QueryHandler(GetRolesQuery)
export class GetRolesHandler implements IQueryHandler<GetRolesQuery, GetRolesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(_query: GetRolesQuery): Promise<GetRolesResponseDto> {
    const roles = await this.identifyRoles();
    const userCounts = await this.identifyUserCounts();
    return this.process(roles, userCounts);
  }

  private async identifyRoles(): Promise<Role[]> {
    return this.em.find(Role, {}, { orderBy: { createdAt: 'ASC' } });
  }

  private async identifyUserCounts(): Promise<Record<string, number>> {
    const users = await this.em.find(User, { role: { $ne: null } }, { fields: ['role'] });
    const counts: Record<string, number> = {};
    for (const u of users) {
      if (u.role) {
        counts[u.role] = (counts[u.role] ?? 0) + 1;
      }
    }
    return counts;
  }

  private process(roles: Role[], userCounts: Record<string, number>): GetRolesResponseDto {
    const roleDtos = roles.map((r) => new RoleDto(r, userCounts[r.name] ?? 0));
    return { items: roleDtos, roles: roleDtos };
  }
}
