import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SystemConfig as SystemConfigEntity } from '#/entities/system-config/system-config.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetAdminSystemConfigResponseDto } from '#/modules/system-config/dto';
import { GetAdminSystemConfigQuery } from '#/modules/system-config/queries/get-admin-system-config.query';

@Injectable()
@QueryHandler(GetAdminSystemConfigQuery)
export class GetAdminSystemConfigHandler implements IQueryHandler<GetAdminSystemConfigQuery, GetAdminSystemConfigResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<GetAdminSystemConfigResponseDto> {
    const configs = await this.identifyConfigs();
    return this.process(configs);
  }

  private async identifyConfigs(): Promise<SystemConfigEntity[]> {
    return this.em.find(SystemConfigEntity, {}, {
      filters: false,
      orderBy: { category: 'ASC', key: 'ASC' },
    });
  }

  private process(configs: SystemConfigEntity[]): GetAdminSystemConfigResponseDto {
    return {
      ...new GetAdminSystemConfigResponseDto(configs),
    };
  }
}
