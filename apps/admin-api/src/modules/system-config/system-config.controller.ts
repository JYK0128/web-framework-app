import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';
import { ApiErrorResponseDto } from '#/core/http/dto/response/api.response.dto';

import { GetSystemConfigQuery } from './get-system-config.query';
import { GetSystemConfigRequestDto } from './get-system-config.request.dto';
import { SystemConfigResponseDto } from './system-config.response.dto';
import { UpdateSystemConfigCommand } from './update-system-config.command';
import { UpdateSystemConfigRequestDto } from './update-system-config.request.dto';
import { UpdateSystemConfigResponseDto } from './update-system-config.response.dto';

@ApiTags('system-configs')
@UserAuth()
@Controller('system-config')
export class SystemConfigController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Permissions(AdminPermission.system.read)
  @SwaggerApiResponse(SystemConfigResponseDto)
  @ApiOperation({ summary: '시스템 설정 조회' })
  async getConfigs(@Query() input: GetSystemConfigRequestDto): Promise<SystemConfigResponseDto> {
    return this.queryBus.execute(new GetSystemConfigQuery(input));
  }

  @Patch()
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(UpdateSystemConfigResponseDto)
  @ApiResponse({
    status: 503,
    description: 'SYSTEM_CONFIG_UPDATE_INCOMPLETE: details에 저장 확인·동기화 확인·서비스 반영 미확인 항목을 반환합니다.',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiErrorResponseDto) },
        { type: 'object', properties: { details: { $ref: getSchemaPath(UpdateSystemConfigResponseDto) } } },
      ],
    },
  })
  @ApiOperation({ summary: '시스템 설정 수정' })
  updateConfigs(@Body() input: UpdateSystemConfigRequestDto): Promise<UpdateSystemConfigResponseDto> {
    return this.commandBus.execute(new UpdateSystemConfigCommand(input));
  }
}
