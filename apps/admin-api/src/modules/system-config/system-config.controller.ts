import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { Permissions, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';
import { ApiErrorResponseDto } from '@pkg/server-core/http/dto/response';
import { AdminPermission } from '@pkg/shared';

import { GetSystemConfigQuery } from '~/modules/system-config/get-system-config.query';
import { GetSystemConfigRequestDto } from '~/modules/system-config/get-system-config.request.dto';
import { GetSystemConfigResponseDto } from '~/modules/system-config/get-system-config.response.dto';
import { UpdateSystemConfigCommand } from '~/modules/system-config/update-system-config.command';
import { UpdateSystemConfigRequestDto } from '~/modules/system-config/update-system-config.request.dto';
import { UpdateSystemConfigResponseDto } from '~/modules/system-config/update-system-config.response.dto';

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
  @SwaggerApiResponse(GetSystemConfigResponseDto)
  @ApiOperation({ summary: '시스템 설정 조회' })
  async getConfigs(@Query() input: GetSystemConfigRequestDto): Promise<GetSystemConfigResponseDto> {
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
