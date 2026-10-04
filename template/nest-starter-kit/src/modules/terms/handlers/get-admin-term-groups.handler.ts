import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetAdminTermGroupsResponseDto } from '#/modules/terms/dto';
import { TermGroupItemDto } from '#/modules/terms/dto/term-group-item.dto';
import { GetAdminTermGroupsQuery } from '#/modules/terms/queries/get-admin-term-groups.query';

@Injectable()
@QueryHandler(GetAdminTermGroupsQuery)
export class GetAdminTermGroupsHandler implements IQueryHandler<GetAdminTermGroupsQuery, GetAdminTermGroupsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(_query: GetAdminTermGroupsQuery): Promise<GetAdminTermGroupsResponseDto> {
    const groups = await this.identifyTermGroups();
    this.verify(groups);
    return this.process(groups);
  }

  private verify(groups: TermGroup[]): void {
    if (!Array.isArray(groups)) {
      throw new Error('약관 그룹 목록을 확인할 수 없습니다.');
    }
  }

  private async identifyTermGroups(): Promise<TermGroup[]> {
    return this.em.find(TermGroup, {}, { orderBy: { sortOrder: 'ASC', createdAt: 'ASC' } });
  }

  private process(groups: TermGroup[]): GetAdminTermGroupsResponseDto {
    return GetAdminTermGroupsResponseDto.fromPlain({
      items: groups.map((group): TermGroupItemDto => ({
        id: group.id,
        code: group.code,
        title: group.title,
        isRequired: group.isRequired,
        sortOrder: group.sortOrder,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      })),
    });
  }
}
