import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { AdminServiceTermItemDto, AdminServiceTermListResponseDto } from '#/modules/service-terms/dto';
import { GetAdminServiceTermsQuery } from '#/modules/service-terms/queries';

@Injectable()
@QueryHandler(GetAdminServiceTermsQuery)
export class GetAdminServiceTermsHandler implements IQueryHandler<GetAdminServiceTermsQuery, AdminServiceTermListResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetAdminServiceTermsQuery): Promise<AdminServiceTermListResponseDto> {
    const result = await this.em.findByPage(Term, input.toFilterQuery(), {
      ...input.toPageOptions(),
      populate: ['termGroup'],
    });
    return AdminServiceTermListResponseDto.fromPlain({
      ...result,
      items: result.items.map(toAdminServiceTerm),
    });
  }
}

export function toAdminServiceTerm(term: Term): AdminServiceTermItemDto {
  return AdminServiceTermItemDto.fromPlain({ id: term.id, groupId: term.termGroup.id, title: term.termGroup.title, version: term.version, content: term.content, reason: term.reason, summary: term.summary, isNoticeRequired: term.isNoticeRequired, isRequired: term.termGroup.isRequired, sortOrder: term.termGroup.sortOrder, isPublished: term.isPublished, publishedAt: term.publishedAt, createdAt: term.createdAt, updatedAt: term.updatedAt });
}
