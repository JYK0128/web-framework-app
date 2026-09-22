import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { MachineAuth } from '#/common/decorators/auth-mode.decorator';
import { SystemConfig } from '#/entities/system-configs/system-config.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

@ApiTags('internal-configs')
@MachineAuth()
@Controller('internal/system-configs')
export class InternalConfigsController {
  constructor(private readonly em: AppEntityManager) {}

  @ApiOperation({ summary: '운영 설정 조회' })
  @Get()
  async listConfigs() {
    const configs = await this.em.find(SystemConfig, {});

    return {
      configs: configs.map((config) => ({
        code: config.code,
        value: config.value,
        description: config.description,
        updatedAt: config.updatedAt,
      })),
    };
  }
}
