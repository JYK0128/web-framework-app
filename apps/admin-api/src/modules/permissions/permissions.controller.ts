import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { GetPermissionsResponseDto } from './interfaces';
import { GetPermissionsQuery } from './queries';

@ApiTags('permissions')
@UserAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Permissions(Permission.role.read)
  @SwaggerApiResponse(GetPermissionsResponseDto)
  @ApiOperation({ summary: '권한 목록 조회' })
  getPermissions(): Promise<GetPermissionsResponseDto> {
    return this.queryBus.execute(new GetPermissionsQuery());
  }
}
