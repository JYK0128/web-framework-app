import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { AdminTermGroupItemDto, GetAdminTermGroupsResponseDto } from '#/modules/terms/interfaces';
import { GetAdminTermGroupsQuery } from '#/modules/terms/queries';

@Injectable()
@QueryHandler(GetAdminTermGroupsQuery)
export class GetAdminTermGroupsHandler implements IQueryHandler<GetAdminTermGroupsQuery, GetAdminTermGroupsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<GetAdminTermGroupsResponseDto> {
    const groups = await this.em.find(TermGroup, {}, { orderBy: { sortOrder: 'ASC', createdAt: 'ASC' } });
    return GetAdminTermGroupsResponseDto.fromPlain({ items: groups.map((group) => AdminTermGroupItemDto.from(group)) });
  }
}
