import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';

import { AdminConfigClient, type RemoteSystemConfig } from './admin-config.client';

@ApiTags('System Configs')
@UserAuth()
@Controller('system-configs')
export class SystemConfigsController {
  constructor(private readonly adminConfigClient: AdminConfigClient) {}

  @ApiOperation({ summary: '관리자 설정 조회' })
  @Get()
  async listConfigs(): Promise<{ configs: RemoteSystemConfig[] }> {
    return {
      configs: await this.adminConfigClient.fetchSystemConfigs(),
    };
  }
}
