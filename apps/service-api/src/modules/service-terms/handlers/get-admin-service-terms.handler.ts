import { Injectable } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { AdminServiceTermItemDto, AdminServiceTermListResponseDto } from '../dto';
import { GetAdminServiceTermsQuery } from '../queries';

@Injectable()
@QueryHandler(GetAdminServiceTermsQuery)
export class GetAdminServiceTermsHandler implements IQueryHandler<GetAdminServiceTermsQuery, AdminServiceTermListResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetAdminServiceTermsQuery): Promise<AdminServiceTermListResponseDto> {
    const all = await this.em.find(Term, {}, { populate: ['termGroup'] });
    const search = input.search?.trim().toLowerCase();
    const filtered = all.filter((term) => (!input.code || term.termGroup.code === input.code) && (!search || `${term.version} ${term.content} ${term.termGroup.title}`.toLowerCase().includes(search)));
    filtered.sort((a, b) => (a.termGroup.sortOrder - b.termGroup.sortOrder) || (b.createdAt.getTime() - a.createdAt.getTime()));
    const start = (input.page - 1) * input.limit;
    const items = filtered.slice(start, start + input.limit).map(toAdminServiceTerm);
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / input.limit);
    return AdminServiceTermListResponseDto.fromPlain({ items, page: input.page, totalPages, totalCount, hasNextPage: input.page < totalPages, hasPrevPage: input.page > 1 && totalCount > 0 });
  }
}

export function toAdminServiceTerm(term: Term): AdminServiceTermItemDto {
  return AdminServiceTermItemDto.fromPlain({ id: term.id, groupId: term.termGroup.id, code: term.termGroup.code, title: term.termGroup.title, version: term.version, content: term.content, isRequired: term.termGroup.isRequired, sortOrder: term.termGroup.sortOrder, isPublished: term.isPublished, publishedAt: term.publishedAt, createdAt: term.createdAt, updatedAt: term.updatedAt });
}
