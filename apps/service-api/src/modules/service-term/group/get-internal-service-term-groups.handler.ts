import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { TermGroup } from '~/core/database/entities/terms';
import { GetInternalServiceTermGroupsQuery } from '~/modules/service-term/group/get-internal-service-term-groups.query';
import { GetInternalServiceTermGroupsResponseDto } from '~/modules/service-term/group/get-internal-service-term-groups.response.dto';
import { InternalServiceTermGroupItemDto } from '~/modules/service-term/group/internal-service-term-group-item.dto';

@Injectable()
@QueryHandler(GetInternalServiceTermGroupsQuery)
export class GetInternalServiceTermGroupsHandler implements IQueryHandler<GetInternalServiceTermGroupsQuery, GetInternalServiceTermGroupsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<GetInternalServiceTermGroupsResponseDto> {
    const groups = await this.em.find(TermGroup, {}, { orderBy: { sortOrder: 'ASC', createdAt: 'ASC' } });
    return GetInternalServiceTermGroupsResponseDto.parse({ items: groups.map((group) => InternalServiceTermGroupItemDto.parseEntity(group)) });
  }
}
