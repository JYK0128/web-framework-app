import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/database/entity-manager';
import { Term } from '#/entities/terms/term.entity';
import { GetTermsResponseDto } from '#/modules/terms/dto/get-terms.response.dto';
import { GetTermsQuery } from '#/modules/terms/queries/get-terms.query';

@Injectable()
@QueryHandler(GetTermsQuery)
export class GetTermsHandler implements IQueryHandler<GetTermsQuery, GetTermsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(_query: GetTermsQuery): Promise<GetTermsResponseDto> {
    const terms = await this.identifyPublishedTerms();
    return this.process(terms);
  }

  private async identifyPublishedTerms(): Promise<Term[]> {
    return this.em.find(
      Term,
      { publishedAt: { $ne: null, $lte: new Date() } },
      { populate: ['termGroup'], orderBy: { publishedAt: 'DESC' } },
    );
  }

  private process(terms: Term[]): GetTermsResponseDto {
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
