import { Controller, Get, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { MachineAuth } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { SystemConfig, SystemConfigCode } from '#/entities/system-configs/system-config.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

import { SupportRuntimeConfigResponseDto } from './dto/support-runtime-config.response.dto';

@ApiTags('internal-configs')
@MachineAuth()
@Controller('internal/system-configs')
export class InternalConfigsController {
  constructor(private readonly em: AppEntityManager) {}

  @ApiOperation({ summary: '운영 설정 조회' })
  @Get()
  async listConfigs() {
    const configs = await this.em.find(SystemConfig, { isPublic: true });

    return {
      configs: configs.map((config) => ({
        code: config.code,
        value: config.value,
        description: config.description,
        updatedAt: config.updatedAt,
      })),
    };
  }

  @ApiOperation({ summary: 'service-api 고객지원 런타임 설정 조회' })
  @Get('support-runtime')
  @SwaggerApiResponse(SupportRuntimeConfigResponseDto)
  async getSupportRuntimeConfig(): Promise<SupportRuntimeConfigResponseDto> {
    const configs = await this.em.find(SystemConfig, {
      code: { $in: [SystemConfigCode.OPERATION, SystemConfigCode.MAINTENANCE, SystemConfigCode.INQUIRY] },
    }, { filters: false });
    const values = new Map(configs.map(({ code, value }) => [code, value]));
    const operation = values.get(SystemConfigCode.OPERATION);
    const maintenance = values.get(SystemConfigCode.MAINTENANCE);
    const inquiry = values.get(SystemConfigCode.INQUIRY);
    if (operation === undefined || inquiry === undefined) {
      throw new NotFoundException('고객지원 런타임 설정이 준비되지 않았습니다.');
    }
    return plainToInstance(SupportRuntimeConfigResponseDto, {
      operation,
      ...(maintenance !== undefined ? { maintenance } : {}),
      inquiry,
    });
  }
}
