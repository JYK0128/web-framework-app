import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Permission } from '#/entities/auth.extensions/permission.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetPermissionsResponseDto, PermissionItemDto } from '#/modules/permissions/interfaces';
import { GetPermissionsQuery } from '#/modules/permissions/queries';

@Injectable()
@QueryHandler(GetPermissionsQuery)
export class GetPermissionsHandler implements IQueryHandler<GetPermissionsQuery, GetPermissionsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<GetPermissionsResponseDto> {
    const permissions = await this.em.find(Permission, {});
    return GetPermissionsResponseDto.fromPlain({
      items: permissions.map((permission) => PermissionItemDto.from(permission)),
    });
  }
}
