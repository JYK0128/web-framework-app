import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/database/entity-manager';
import { Role } from '#/entities/auth.extentions/role.entity';
import { GetRolesResponseDto } from '#/modules/roles/dto';
import { GetRolesQuery } from '#/modules/roles/queries/get-roles.query';

@Injectable()
@QueryHandler(GetRolesQuery)
export class GetRolesHandler implements IQueryHandler<GetRolesQuery, GetRolesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(_query: GetRolesQuery): Promise<GetRolesResponseDto> {
    const roles = await this.identifyRoles();
    return this.process(roles);
  }

  private async identifyRoles(): Promise<Role[]> {
    return this.em.find(Role, {});
  }

  private process(roles: Role[]): GetRolesResponseDto {
    return { items: roles, roles };
  }
}
