import { EntityManager } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/entities/terms/term.entity';
import { GetTermsResponseDto } from '#/modules/terms/dto/get-terms.response.dto';
import { GetTermsQuery } from '#/modules/terms/queries/get-terms.query';

@Injectable()
@QueryHandler(GetTermsQuery)
export class GetTermsHandler implements IQueryHandler<GetTermsQuery, GetTermsResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(_query: GetTermsQuery): Promise<GetTermsResponseDto> {
    const terms = await this.em.find(
      Term,
      { publishedAt: { $ne: null, $lte: new Date() } },
      { populate: ['termGroup'], orderBy: { publishedAt: 'DESC' } },
    );

    const termMap = new Map<string, Term>();
    for (const t of terms) {
      if (!termMap.has(t.termGroup.id)) {
        termMap.set(t.termGroup.id, t);
      }
    }
    const latestTerms = Array.from(termMap.values()).sort(
      (a, b) => (a.termGroup.sortOrder ?? 0) - (b.termGroup.sortOrder ?? 0),
    );

    return {
      terms: latestTerms.map((term) => ({
        id: term.id,
        version: term.version,
        content: term.content,
        publishedAt: term.publishedAt ?? null,
        code: term.termGroup.code,
        title: term.termGroup.title,
        isRequired: term.termGroup.isRequired,
        sortOrder: term.termGroup.sortOrder,
      })),
    };
  }
}
