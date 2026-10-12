import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term, UserTermAgreement } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { TermAgreementItemDto, TermAgreementListResponseDto } from '#/modules/terms/dto';
import { GetAgreementsQuery } from '#/modules/terms/queries';

@Injectable()
@QueryHandler(GetAgreementsQuery)
export class GetAgreementsHandler implements IQueryHandler<GetAgreementsQuery, TermAgreementListResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly principalContext: PrincipalContext,
  ) {}

  async execute(_query: GetAgreementsQuery): Promise<TermAgreementListResponseDto> {
    const userId = this.principalContext.ensureUser().id;
    const terms = await this.em.find(
      Term,
      { publishedAt: { $ne: null, $lte: new Date() } },
      { populate: ['termGroup'], orderBy: { publishedAt: 'DESC' } },
    );
    const latestAgreements = await this.em.find(
      UserTermAgreement,
      { user: userId },
      { populate: ['term', 'term.termGroup'], orderBy: { createdAt: 'DESC' } },
    );

    const latestByGroup = new Map<string, UserTermAgreement>();
    for (const agreement of latestAgreements) {
      if (!latestByGroup.has(agreement.term.termGroup.id)) {
        latestByGroup.set(agreement.term.termGroup.id, agreement);
      }
    }

    const latestTermsByGroup = new Map<string, Term>();
    for (const term of terms) {
      if (!latestTermsByGroup.has(term.termGroup.id)) {
        latestTermsByGroup.set(term.termGroup.id, term);
      }
    }

    return TermAgreementListResponseDto.parse({
      items: [...latestTermsByGroup.values()].sort(
        (a, b) => (a.termGroup.sortOrder ?? 0) - (b.termGroup.sortOrder ?? 0),
      ).map((term) => TermAgreementItemDto.parseEntity(
        term,
        latestByGroup.get(term.termGroup.id)?.isAgreed === true
        && latestByGroup.get(term.termGroup.id)?.term.id === term.id,
        latestByGroup.get(term.termGroup.id)?.metadata ?? null,
      )),
    });
  }
}
