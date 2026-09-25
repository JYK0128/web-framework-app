import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public, UserAuth } from '#/common/decorators/auth-mode.decorator';
import { NoStore } from '#/common/decorators/no-store.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { SupportRuntimeConfigService } from '#/modules/support/support-runtime-config.service';

import { AdminConfigClient, type RemoteSystemConfig } from './admin-config.client';
import { OperationNoticeResponseDto } from './operation-notice.response.dto';
import { PublicSystemConfigListResponseDto } from './public-system-config-list.response.dto';

@ApiTags('System Configs')
@UserAuth()
@Controller('system-configs')
export class SystemConfigsController {
  constructor(
    private readonly adminConfigClient: AdminConfigClient,
    private readonly supportRuntimeConfigService: SupportRuntimeConfigService,
  ) {}

  @NoStore()
  @ApiOperation({ summary: '현재 고객센터 운영시간 안내 조회' })
  @Get('operation-notice')
  @SwaggerApiResponse(OperationNoticeResponseDto)
  getOperationNotice(): Promise<OperationNoticeResponseDto> {
    return this.supportRuntimeConfigService.getOperationNotice();
  }

  @Public()
  @NoStore()
  @ApiOperation({ summary: '공개 서비스 설정 조회' })
  @Get()
  @SwaggerApiResponse(PublicSystemConfigListResponseDto)
  async listConfigs(): Promise<PublicSystemConfigListResponseDto> {
    return { configs: await this.adminConfigClient.fetchSystemConfigs() };
  }
}
