import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { NoStore } from '@pkg/server-core/http/decorators/no-store.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';
import { plainToInstance } from 'class-transformer';

import { GetPublicSystemConfigsRequestDto } from '#/modules/system-config/get-public-system-configs.request.dto';
import { GetPublicSystemConfigsResponseDto } from '#/modules/system-config/get-public-system-configs.response.dto';
import { ServiceContext } from '#/modules/system-config/service.context';

@ApiTags('System Configs')
@UserAuth()
@Controller('service-configs')
export class SystemConfigsController {
  constructor(private readonly serviceContext: ServiceContext) {}

  @Public()
  @NoStore()
  @ApiOperation({ summary: '프론트에서 사용하는 공개 서비스 설정 조회' })
  @Get()
  @SwaggerApiResponse(GetPublicSystemConfigsResponseDto)
  async getConfigs(_input: GetPublicSystemConfigsRequestDto = new GetPublicSystemConfigsRequestDto()): Promise<GetPublicSystemConfigsResponseDto> {
    const { operation, maintenance } = await this.serviceContext.getConfig();
    return plainToInstance(GetPublicSystemConfigsResponseDto, { operation, maintenance });
  }
}
