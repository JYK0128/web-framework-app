import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Permission } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { PermissionItemDto, PermissionListResponseDto } from '#/modules/permissions';
import { GetPermissionsQuery } from '#/modules/permissions/get-permissions.query';

@Injectable()
@QueryHandler(GetPermissionsQuery)
export class GetPermissionsHandler implements IQueryHandler<GetPermissionsQuery, PermissionListResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<PermissionListResponseDto> {
    const permissions = await this.em.find(Permission, {});
    return PermissionListResponseDto.parse({
      items: permissions.map((permission) => PermissionItemDto.parseEntity(permission)),
    });
  }
}
