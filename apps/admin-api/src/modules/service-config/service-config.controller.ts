import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';
import { ServiceConfigResponseDto } from '#/modules/service-config/service-config.response.dto';
import { UpdateServiceConfigRequestDto } from '#/modules/service-config/update-service-config.request.dto';
import { UpdateServiceConfigResponseDto } from '#/modules/service-config/update-service-config.response.dto';

import { GetServiceConfigQuery } from './get-service-config.query';
import { GetServiceConfigRequestDto } from './get-service-config.request.dto';
import { UpdateServiceConfigCommand } from './update-service-config.command';

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
  @SwaggerApiResponse(ServiceConfigResponseDto)
  @ApiOperation({ summary: '서비스 설정 조회' })
  async getConfigs(@Query() input: GetServiceConfigRequestDto): Promise<ServiceConfigResponseDto> {
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
