import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SystemConfig as SystemConfigEntity } from '#/entities/system-config/system-config.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetAdminSystemConfigResponseDto, SystemConfigItemDto } from '#/modules/system-config/dto';
import { GetAdminSystemConfigQuery } from '#/modules/system-config/queries/get-admin-system-config.query';

@QueryHandler(GetAdminSystemConfigQuery)
export class GetAdminSystemConfigHandler implements IQueryHandler<GetAdminSystemConfigQuery, GetAdminSystemConfigResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<GetAdminSystemConfigResponseDto> {
    const configs = await this.em.find(SystemConfigEntity, {}, {
      filters: false,
      orderBy: { category: 'ASC', key: 'ASC' },
    });

    return {
      items: configs.map((conf) => new SystemConfigItemDto(conf)),
    };
  }
}
