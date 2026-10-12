import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';

import { PermissionListResponseDto } from '.';
import { GetPermissionsQuery } from './get-permissions.query';

@ApiTags('permissions')
@UserAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Permissions(AdminPermission.role.read)
  @SwaggerApiResponse(PermissionListResponseDto)
  @ApiOperation({ summary: '권한 목록 조회' })
  getPermissions(): Promise<PermissionListResponseDto> {
    return this.queryBus.execute(new GetPermissionsQuery());
  }
}
