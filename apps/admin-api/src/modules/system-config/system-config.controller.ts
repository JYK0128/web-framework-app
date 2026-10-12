import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';

import { GetSystemConfigQuery } from './get-system-config.query';
import { GetSystemConfigRequestDto } from './get-system-config.request.dto';
import { SystemConfigResponseDto } from './system-config.response.dto';
import { UpdateSystemConfigCommand } from './update-system-config.command';
import { UpdateSystemConfigRequestDto } from './update-system-config.request.dto';
import { UpdateSystemConfigResponseDto } from './update-system-config.response.dto';

@ApiTags('system-configs')
@UserAuth()
@Controller()
export class SystemConfigController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('system-config')
  @Permissions(AdminPermission.system.read)
  @SwaggerApiResponse(SystemConfigResponseDto)
  @ApiOperation({ summary: '시스템 설정 조회' })
  async getConfigs(@Query() input: GetSystemConfigRequestDto): Promise<SystemConfigResponseDto> {
    return this.queryBus.execute(new GetSystemConfigQuery(input));
  }

  @Patch('system-config')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(UpdateSystemConfigResponseDto)
  @ApiOperation({ summary: '시스템 설정 수정' })
  updateConfigs(@Body() input: UpdateSystemConfigRequestDto): Promise<UpdateSystemConfigResponseDto> {
    return this.commandBus.execute(new UpdateSystemConfigCommand(input));
  }
}
