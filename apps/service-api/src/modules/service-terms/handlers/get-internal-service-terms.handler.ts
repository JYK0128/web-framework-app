import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { InternalServiceTermItemDto, InternalServiceTermListResponseDto } from '#/modules/service-terms/dto';
import { GetInternalServiceTermsQuery } from '#/modules/service-terms/queries';

@Injectable()
@QueryHandler(GetInternalServiceTermsQuery)
export class GetInternalServiceTermsHandler implements IQueryHandler<GetInternalServiceTermsQuery, InternalServiceTermListResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetInternalServiceTermsQuery): Promise<InternalServiceTermListResponseDto> {
    const result = await this.em.findByPage(Term, input.toFilterQuery(), {
      ...input.toPageOptions(),
      populate: ['termGroup'],
    });
    return InternalServiceTermListResponseDto.fromPlain({
      ...result,
      items: result.items.map(toInternalServiceTerm),
    });
  }
}

export function toInternalServiceTerm(term: Term): InternalServiceTermItemDto {
  return InternalServiceTermItemDto.fromPlain({ id: term.id, groupId: term.termGroup.id, title: term.termGroup.title, version: term.version, content: term.content, reason: term.reason, summary: term.summary, isNoticeRequired: term.isNoticeRequired, isRequired: term.termGroup.isRequired, sortOrder: term.termGroup.sortOrder, isPublished: term.isPublished, publishedAt: term.publishedAt, createdAt: term.createdAt, updatedAt: term.updatedAt });
}
