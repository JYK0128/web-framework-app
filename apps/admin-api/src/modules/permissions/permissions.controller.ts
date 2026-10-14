import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';
import { AdminPermission } from '@pkg/shared';

import { GetPermissionsQuery } from '#/modules/permissions/get-permissions.query';
import { GetPermissionsRequestDto } from '#/modules/permissions/get-permissions.request.dto';
import { GetPermissionsResponseDto } from '#/modules/permissions/get-permissions.response.dto';

@ApiTags('permissions')
@UserAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Permissions(AdminPermission.role.read)
  @SwaggerApiResponse(GetPermissionsResponseDto)
  @ApiOperation({ summary: '권한 목록 조회' })
  getPermissions(): Promise<GetPermissionsResponseDto> {
    return this.queryBus.execute(new GetPermissionsQuery(new GetPermissionsRequestDto()));
  }
}
