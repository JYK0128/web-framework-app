import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { InternalServiceTermGroupItemDto, InternalServiceTermGroupListResponseDto } from '#/modules/service-terms/dto';
import { GetInternalServiceTermGroupsQuery } from '#/modules/service-terms/queries';

@Injectable()
@QueryHandler(GetInternalServiceTermGroupsQuery)
export class GetInternalServiceTermGroupsHandler implements IQueryHandler<GetInternalServiceTermGroupsQuery, InternalServiceTermGroupListResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<InternalServiceTermGroupListResponseDto> {
    const groups = await this.em.find(TermGroup, {}, { orderBy: { sortOrder: 'ASC', createdAt: 'ASC' } });
    return InternalServiceTermGroupListResponseDto.fromPlain({ items: groups.map((group) => toGroup(group)) });
  }
}

export function toGroup(group: TermGroup): InternalServiceTermGroupItemDto {
  return InternalServiceTermGroupItemDto.fromPlain({ id: group.id, title: group.title, isRequired: group.isRequired, sortOrder: group.sortOrder, createdAt: group.createdAt, updatedAt: group.updatedAt });
}
