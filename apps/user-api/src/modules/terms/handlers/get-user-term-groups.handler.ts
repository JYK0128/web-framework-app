import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetUserTermGroupsResponseDto, UserTermGroupItemDto } from '#/modules/terms/interfaces';
import { GetUserTermGroupsQuery } from '#/modules/terms/queries';

@Injectable()
@QueryHandler(GetUserTermGroupsQuery)
export class GetUserTermGroupsHandler implements IQueryHandler<GetUserTermGroupsQuery, GetUserTermGroupsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<GetUserTermGroupsResponseDto> {
    const groups = await this.em.find(TermGroup, {}, { orderBy: { sortOrder: 'ASC', createdAt: 'ASC' } });
    return GetUserTermGroupsResponseDto.fromPlain({ items: groups.map((group) => UserTermGroupItemDto.from(group)) });
  }
}
