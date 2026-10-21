import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';
import { AdminPermission } from '@pkg/shared';

import { GetServiceConfigQuery } from '~/modules/service-config/get-service-config.query';
import { GetServiceConfigRequestDto } from '~/modules/service-config/get-service-config.request.dto';
import { GetServiceConfigResponseDto } from '~/modules/service-config/get-service-config.response.dto';
import { UpdateServiceConfigCommand } from '~/modules/service-config/update-service-config.command';
import { UpdateServiceConfigRequestDto } from '~/modules/service-config/update-service-config.request.dto';
import { UpdateServiceConfigResponseDto } from '~/modules/service-config/update-service-config.response.dto';

@ApiTags('service-config')
@UserAuth()
@Controller('service-config')
export class ServiceConfigController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Permissions(AdminPermission.system.read)
  @SwaggerApiResponse(GetServiceConfigResponseDto)
  @ApiOperation({ summary: '서비스 설정 조회' })
  async getConfigs(@Query() input: GetServiceConfigRequestDto): Promise<GetServiceConfigResponseDto> {
    return this.queryBus.execute(new GetServiceConfigQuery(input));
  }

  @Patch()
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(UpdateServiceConfigResponseDto)
  @ApiOperation({ summary: '서비스 설정 전체 수정' })
  updateConfigs(@Body() input: UpdateServiceConfigRequestDto): Promise<UpdateServiceConfigResponseDto> {
    return this.commandBus.execute(new UpdateServiceConfigCommand(input));
  }
}
