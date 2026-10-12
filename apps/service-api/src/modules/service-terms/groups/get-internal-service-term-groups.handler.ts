import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TermGroup } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { InternalServiceTermGroupItemDto, InternalServiceTermGroupListResponseDto } from '#/modules/service-terms';
import { GetInternalServiceTermGroupsQuery } from '#/modules/service-terms/groups/get-internal-service-term-groups.query';

@Injectable()
@QueryHandler(GetInternalServiceTermGroupsQuery)
export class GetInternalServiceTermGroupsHandler implements IQueryHandler<GetInternalServiceTermGroupsQuery, InternalServiceTermGroupListResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<InternalServiceTermGroupListResponseDto> {
    const groups = await this.em.find(TermGroup, {}, { orderBy: { sortOrder: 'ASC', createdAt: 'ASC' } });
    return InternalServiceTermGroupListResponseDto.parse({ items: groups.map((group) => InternalServiceTermGroupItemDto.parseEntity(group)) });
  }
}
