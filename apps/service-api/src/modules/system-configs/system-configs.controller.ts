import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { Public, UserAuth } from '#/common/decorators/auth-mode.decorator';
import { NoStore } from '#/common/decorators/no-store.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { PublicSystemConfigsResponseDto } from './public-system-configs.response.dto';
import { SystemContext } from './system.context';

@ApiTags('System Configs')
@UserAuth()
@Controller('service-configs')
export class SystemConfigsController {
  constructor(private readonly systemContext: SystemContext) {}

  @Public()
  @NoStore()
  @ApiOperation({ summary: '프론트에서 사용하는 공개 서비스 설정 조회' })
  @Get()
  @SwaggerApiResponse(PublicSystemConfigsResponseDto)
  async listConfigs(): Promise<PublicSystemConfigsResponseDto> {
    return plainToInstance(PublicSystemConfigsResponseDto, await this.systemContext.getPublicConfig());
  }
}
