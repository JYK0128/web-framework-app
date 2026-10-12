import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TermGroup } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { GetTermGroupsQuery } from '#/modules/terms/groups/get-term-groups.query';
import { GetTermGroupsResponseDto } from '#/modules/terms/groups/get-term-groups.response.dto';
import { TermGroupItemDto } from '#/modules/terms/groups/term-group-item.dto';

@Injectable()
@QueryHandler(GetTermGroupsQuery)
export class GetTermGroupsHandler implements IQueryHandler<GetTermGroupsQuery, GetTermGroupsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<GetTermGroupsResponseDto> {
    const groups = await this.em.find(TermGroup, {}, { orderBy: { sortOrder: 'ASC', createdAt: 'ASC' } });
    return GetTermGroupsResponseDto.parse({ items: groups.map((group) => TermGroupItemDto.parseEntity(group)) });
  }
}
