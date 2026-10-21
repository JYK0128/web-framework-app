import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';
import { AdminPermission } from '@pkg/shared';

import { GetPermissionsQuery } from '~/modules/permission/get-permissions.query';
import { GetPermissionsRequestDto } from '~/modules/permission/get-permissions.request.dto';
import { GetPermissionsResponseDto } from '~/modules/permission/get-permissions.response.dto';

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
