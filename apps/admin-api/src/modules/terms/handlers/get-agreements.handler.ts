import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetAgreementsResponseDto, TermAgreementItemDto } from '#/modules/terms/interfaces';
import { GetAgreementsQuery } from '#/modules/terms/queries';

@Injectable()
@QueryHandler(GetAgreementsQuery)
export class GetAgreementsHandler implements IQueryHandler<GetAgreementsQuery, GetAgreementsResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly principalContext: PrincipalContext,
  ) {}

  async execute(_query: GetAgreementsQuery): Promise<GetAgreementsResponseDto> {
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

    return GetAgreementsResponseDto.fromPlain({
      items: [...latestTermsByGroup.values()].sort(
        (a, b) => (a.termGroup.sortOrder ?? 0) - (b.termGroup.sortOrder ?? 0),
      ).map((term) => TermAgreementItemDto.from(
        term,
        latestByGroup.get(term.termGroup.id)?.isAgreed === true
        && latestByGroup.get(term.termGroup.id)?.term.id === term.id,
        latestByGroup.get(term.termGroup.id)?.metadata ?? null,
      )),
    });
  }
}
