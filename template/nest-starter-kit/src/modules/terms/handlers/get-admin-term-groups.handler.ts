import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetAdminTermGroupsResponseDto, TermGroupItemDto } from '#/modules/terms/dto';
import { GetAdminTermGroupsQuery } from '#/modules/terms/queries/get-admin-term-groups.query';

@Injectable()
@QueryHandler(GetAdminTermGroupsQuery)
export class GetAdminTermGroupsHandler implements IQueryHandler<GetAdminTermGroupsQuery, GetAdminTermGroupsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(_query: GetAdminTermGroupsQuery): Promise<GetAdminTermGroupsResponseDto> {
    const groups = await this.identifyTermGroups();
    return this.process(groups);
  }

  private async identifyTermGroups(): Promise<TermGroup[]> {
    return this.em.find(TermGroup, {}, { orderBy: { sortOrder: 'ASC', createdAt: 'ASC' } });
  }

  private process(groups: TermGroup[]): GetAdminTermGroupsResponseDto {
    return {
      groups: groups.map((group) => new TermGroupItemDto(group)),
    };
  }
}
