import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Role } from '#/entities/auth.extensions/role.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetRolesResponseDto } from '#/modules/roles/dto';
import { RoleItemDto } from '#/modules/roles/dto/role-item.dto';
import { GetRolesQuery } from '#/modules/roles/queries/get-roles.query';

@Injectable()
@QueryHandler(GetRolesQuery)
export class GetRolesHandler implements IQueryHandler<GetRolesQuery, GetRolesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(_query: GetRolesQuery): Promise<GetRolesResponseDto> {
    const roles = await this.identifyRoles();
    const userCounts = await this.identifyUserCounts();
    this.verify(roles, userCounts);
    return this.process(roles, userCounts);
  }

  private verify(roles: Role[], userCounts: Record<string, number>): void {
    if (!Array.isArray(roles) || !userCounts || typeof userCounts !== 'object') {
      throw new Error('역할 목록을 확인할 수 없습니다.');
    }
  }

  private async identifyRoles(): Promise<Role[]> {
    return this.em.find(Role, {}, { orderBy: { createdAt: 'ASC' } });
  }

  private async identifyUserCounts(): Promise<Record<string, number>> {
    const users = await this.em.find(User, { role: { $ne: null } }, { fields: ['role'] });
    const counts: Record<string, number> = {};
    for (const u of users) {
      if (u.role) {
        counts[u.role.key] = (counts[u.role.key] ?? 0) + 1;
      }
    }
    return counts;
  }

  private process(roles: Role[], userCounts: Record<string, number>): GetRolesResponseDto {
    const items: RoleItemDto[] = roles.map((r) => ({
      id: r.id,
      key: r.key,
      label: r.label,
      description: r.description,
      isSystem: r.isSystem,
      permissions: r.permissions,
      userCount: userCounts[r.key] ?? 0,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
    return GetRolesResponseDto.fromPlain({ items });
  }
}
