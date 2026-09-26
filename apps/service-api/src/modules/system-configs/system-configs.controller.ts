import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SYSTEM_CONFIGS_REDIS_KEY } from '@pkg/shared/common';
import { plainToInstance } from 'class-transformer';

import { Public, UserAuth } from '#/common/decorators/auth-mode.decorator';
import { NoStore } from '#/common/decorators/no-store.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { KvStore } from '#/infra/kv-store/kv-store.service';
import type { SupportRuntimeConfig } from '#/modules/support/support-runtime-config.service';

import { PublicSystemConfigsResponseDto } from './public-system-configs.response.dto';

type ServiceConfigSnapshot = PublicSystemConfigsResponseDto & Pick<SupportRuntimeConfig, 'inquiry'>;

@ApiTags('System Configs')
@UserAuth()
@Controller('system-configs')
export class SystemConfigsController {
  constructor(private readonly kvStore: KvStore) {}

  @Public()
  @NoStore()
  @ApiOperation({ summary: '프론트에서 사용하는 공개 서비스 설정 조회' })
  @Get()
  @SwaggerApiResponse(PublicSystemConfigsResponseDto)
  async listConfigs(): Promise<PublicSystemConfigsResponseDto> {
    const configs = await this.kvStore.get<ServiceConfigSnapshot>(SYSTEM_CONFIGS_REDIS_KEY);
    if (!configs) throw new ServiceUnavailableException('서비스 설정을 아직 불러오지 못했습니다.');
    return plainToInstance(PublicSystemConfigsResponseDto, {
      operation: configs.operation,
      maintenance: configs.maintenance,
    });
  }
}
