import { EntityManager } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term, TermStatus } from '#/entities/terms/term.entity';
import { GetPublishedTermsResponseDto } from '#/modules/terms/dto/get-published-terms.response.dto';
import { GetPublishedTermsQuery } from '#/modules/terms/queries/get-published-terms.query';

@Injectable()
@QueryHandler(GetPublishedTermsQuery)
export class GetPublishedTermsHandler implements IQueryHandler<GetPublishedTermsQuery, GetPublishedTermsResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(): Promise<GetPublishedTermsResponseDto> {
    const terms = await this.em.find(
      Term,
      { status: TermStatus.PUBLISHED },
      { populate: ['termGroup'], orderBy: { publishedAt: 'DESC' } },
    );

    const latestTermsMap = new Map<string, Term>();
    for (const term of terms) {
      if (!latestTermsMap.has(term.termGroup.id)) {
        latestTermsMap.set(term.termGroup.id, term);
      }
    }

    return {
      terms: Array.from(latestTermsMap.values()).map((term) => ({
        id: term.termGroup.id,
        code: term.termGroup.code,
        name: term.termGroup.name,
        isRequired: term.termGroup.isRequired,
        term: {
          id: term.id,
          version: term.version,
          content: term.content,
          publishedAt: term.publishedAt ? term.publishedAt.toISOString() : null,
        },
      })),
    };
  }
}
