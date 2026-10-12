import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TermGroup } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { OperatorTermGroupItemDto, OperatorTermGroupListResponseDto } from '#/modules/terms';
import { GetOperatorTermGroupsQuery } from '#/modules/terms/groups/get-operator-term-groups.query';

@Injectable()
@QueryHandler(GetOperatorTermGroupsQuery)
export class GetOperatorTermGroupsHandler implements IQueryHandler<GetOperatorTermGroupsQuery, OperatorTermGroupListResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<OperatorTermGroupListResponseDto> {
    const groups = await this.em.find(TermGroup, {}, { orderBy: { sortOrder: 'ASC', createdAt: 'ASC' } });
    return OperatorTermGroupListResponseDto.parse({ items: groups.map((group) => OperatorTermGroupItemDto.parseEntity(group)) });
  }
}
