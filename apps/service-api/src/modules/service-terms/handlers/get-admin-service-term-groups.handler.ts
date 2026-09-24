import { Injectable } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { AdminServiceTermGroupItemDto, AdminServiceTermGroupListResponseDto } from '../dto';
import { GetAdminServiceTermGroupsQuery } from '../queries';

@Injectable()
@QueryHandler(GetAdminServiceTermGroupsQuery)
export class GetAdminServiceTermGroupsHandler implements IQueryHandler<GetAdminServiceTermGroupsQuery, AdminServiceTermGroupListResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<AdminServiceTermGroupListResponseDto> {
    const groups = await this.em.find(TermGroup, {}, { orderBy: { sortOrder: 'ASC', createdAt: 'ASC' } });
    return AdminServiceTermGroupListResponseDto.fromPlain({ items: groups.map((group) => toGroup(group)) });
  }
}

export function toGroup(group: TermGroup): AdminServiceTermGroupItemDto {
  return AdminServiceTermGroupItemDto.fromPlain({ id: group.id, title: group.title, isRequired: group.isRequired, sortOrder: group.sortOrder, createdAt: group.createdAt, updatedAt: group.updatedAt });
}
