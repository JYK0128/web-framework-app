import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { OperatorTermGroupItemDto, OperatorTermGroupListResponseDto } from '#/modules/terms/interfaces';
import { GetOperatorTermGroupsQuery } from '#/modules/terms/queries';

@Injectable()
@QueryHandler(GetOperatorTermGroupsQuery)
export class GetOperatorTermGroupsHandler implements IQueryHandler<GetOperatorTermGroupsQuery, OperatorTermGroupListResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<OperatorTermGroupListResponseDto> {
    const groups = await this.em.find(TermGroup, {}, { orderBy: { sortOrder: 'ASC', createdAt: 'ASC' } });
    return OperatorTermGroupListResponseDto.fromPlain({ items: groups.map((group) => OperatorTermGroupItemDto.from(group)) });
  }
}
