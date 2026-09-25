import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public, UserAuth } from '#/common/decorators/auth-mode.decorator';
import { MaintenanceExempt } from '#/common/decorators/maintenance-exempt.decorator';
import { NoStore } from '#/common/decorators/no-store.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { SupportRuntimeConfigService } from '#/modules/support/support-runtime-config.service';

import { AdminConfigClient, type RemoteSystemConfig } from './admin-config.client';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceStatusResponseDto } from './maintenance-status.response.dto';
import { OperationNoticeResponseDto } from './operation-notice.response.dto';

@ApiTags('System Configs')
@UserAuth()
@Controller('system-configs')
export class SystemConfigsController {
  constructor(
    private readonly adminConfigClient: AdminConfigClient,
    private readonly maintenanceService: MaintenanceService,
    private readonly supportRuntimeConfigService: SupportRuntimeConfigService,
  ) {}

  @Public()
  @MaintenanceExempt()
  @NoStore()
  @ApiOperation({ summary: '현재 서비스 점검 상태 조회' })
  @Get('maintenance')
  @SwaggerApiResponse(MaintenanceStatusResponseDto)
  getMaintenanceStatus(): Promise<MaintenanceStatusResponseDto> {
    return this.maintenanceService.getStatus();
  }

  @NoStore()
  @ApiOperation({ summary: '현재 고객센터 운영시간 안내 조회' })
  @Get('operation-notice')
  @SwaggerApiResponse(OperationNoticeResponseDto)
  getOperationNotice(): Promise<OperationNoticeResponseDto> {
    return this.supportRuntimeConfigService.getOperationNotice();
  }

  @ApiOperation({ summary: '공개 서비스 설정 조회' })
  @Get()
  async listConfigs(): Promise<{ configs: RemoteSystemConfig[] }> {
    return {
      configs: await this.adminConfigClient.fetchSystemConfigs(),
    };
  }
}
