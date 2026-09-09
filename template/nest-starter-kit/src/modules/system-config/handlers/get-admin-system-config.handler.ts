import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { maskSecrets } from '#/common/decorators/secret.decorator';
import { SystemConfig as SystemConfigEntity, SystemConfigKey } from '#/entities/system-config/system-config.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetAdminSystemConfigResponseDto } from '#/modules/system-config/dto';
import { GetAdminSystemConfigQuery } from '#/modules/system-config/queries/get-admin-system-config.query';

@Injectable()
@QueryHandler(GetAdminSystemConfigQuery)
export class GetAdminSystemConfigHandler implements IQueryHandler<GetAdminSystemConfigQuery, GetAdminSystemConfigResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<GetAdminSystemConfigResponseDto> {
    const configs = await this.identifyConfigs();
    this.verify(configs);
    return this.process(configs);
  }

  private verify(configs: SystemConfigEntity[]): void {
    if (!Array.isArray(configs)) {
      throw new Error('시스템 설정을 확인할 수 없습니다.');
    }

    const configKeys = new Set(configs.map((config) => config.key));
    const missingKeys = Object.values(SystemConfigKey).filter((key) => !configKeys.has(key));
    if (missingKeys.length > 0) {
      throw new Error(`필수 시스템 설정이 누락되었습니다: ${missingKeys.join(', ')}`);
    }
  }

  private async identifyConfigs(): Promise<SystemConfigEntity[]> {
    return this.em.find(SystemConfigEntity, {}, {
      filters: false,
      orderBy: { category: 'ASC', key: 'ASC' },
    });
  }

  private process(configs: SystemConfigEntity[]): GetAdminSystemConfigResponseDto {
    const dto = new GetAdminSystemConfigResponseDto(configs);
    return maskSecrets(dto);
  }
}
