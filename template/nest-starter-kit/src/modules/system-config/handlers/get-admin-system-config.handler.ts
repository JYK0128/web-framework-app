import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SystemConfig as SystemConfigEntity, SystemConfigKey } from '#/entities/system-configs/system-config.entity';
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
    const existingKeys = new Set(configs.map((config) => config.key));
    const requiredKeys = Object.values(SystemConfigKey);
    const missingKeys = requiredKeys.filter((key) => !existingKeys.has(key));

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
    const map = new Map(configs.map((config) => [config.key, config.value]));
    const dto = GetAdminSystemConfigResponseDto.fromPlain({
      operation: map.get(SystemConfigKey.OPERATION),
      maintenance: map.get(SystemConfigKey.MAINTENANCE),
      security: map.get(SystemConfigKey.SECURITY),
      inquiry: map.get(SystemConfigKey.INQUIRY),
      notification: map.get(SystemConfigKey.NOTIFICATION),
      oauth: map.get(SystemConfigKey.OAUTH),
    });
    return (dto.toPlain?.() ?? {}) as unknown as GetAdminSystemConfigResponseDto;
  }
}
