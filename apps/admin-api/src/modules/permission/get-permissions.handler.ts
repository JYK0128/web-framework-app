import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Permission } from '~/core/database/entities/auth.extensions';
import { AppEntityManager } from '~/core/database/entity-manager';
import { GetPermissionsQuery } from '~/modules/permission/get-permissions.query';
import { GetPermissionsResponseDto } from '~/modules/permission/get-permissions.response.dto';
import { PermissionItemDto } from '~/modules/permission/permission-item.dto';

@Injectable()
@QueryHandler(GetPermissionsQuery)
export class GetPermissionsHandler implements IQueryHandler<GetPermissionsQuery, GetPermissionsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<GetPermissionsResponseDto> {
    const permissions = await this.em.find(Permission, {});
    return GetPermissionsResponseDto.parse({
      items: permissions.map((permission) => PermissionItemDto.parseEntity(permission)),
    });
  }
}
