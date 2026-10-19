import { raw } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';

import { Term, UserTermAgreement } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { GetAgreementsQuery } from '#/modules/term/agreement/get-agreements.query';
import { GetAgreementsResponseDto } from '#/modules/term/agreement/get-agreements.response.dto';
import { TermAgreementItemDto } from '#/modules/term/agreement/term-agreement-item.dto';

@Injectable()
@QueryHandler(GetAgreementsQuery)
export class GetAgreementsHandler implements IQueryHandler<GetAgreementsQuery, GetAgreementsResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly principalContext: PrincipalContext,
  ) {}

  async execute(_query: GetAgreementsQuery): Promise<GetAgreementsResponseDto> {
    const userId = this.principalContext.ensureUser().id;
    const termsQuery = this.em.createQueryBuilder(Term, 'term')
      .select('*')
      .innerJoinAndSelect('term.termGroup', 'termGroup', { deletedAt: null })
      .where({ publishedAt: { $ne: null, $lte: new Date() } })
      // Use the FK column directly; populated relation paths acquire SELECT aliases.
      .distinctOn([raw('??.??', ['term', 'termGroup'])])
      .orderBy({ 'term.termGroup': 'ASC', 'term.publishedAt': 'DESC', 'term.id': 'DESC' });
    await termsQuery.applyFilters();
    const terms = await termsQuery.getResultList();
    if (terms.length === 0) return GetAgreementsResponseDto.parse({ items: [] });

    const agreementsQuery = this.em.createQueryBuilder(UserTermAgreement, 'agreement')
      .select('*')
      .innerJoinAndSelect('agreement.term', 'term', { deletedAt: null })
      .innerJoinAndSelect('term.termGroup', 'termGroup', { deletedAt: null })
      .where({ user: userId, term: { termGroup: { $in: terms.map((term) => term.termGroup.id) } } })
      // Use the FK column directly; populated relation paths acquire SELECT aliases.
      .distinctOn([raw('??.??', ['term', 'termGroup'])])
      .orderBy({ 'term.termGroup': 'ASC', 'agreement.createdAt': 'DESC', 'agreement.id': 'DESC' });
    await agreementsQuery.applyFilters();
    const latestAgreements = await agreementsQuery.getResultList();
    const latestByGroup = new Map(latestAgreements.map((agreement) => [agreement.term.termGroup.id, agreement]));

    return GetAgreementsResponseDto.parse({
      items: terms.toSorted(
        (a, b) => (a.termGroup.sortOrder ?? 0) - (b.termGroup.sortOrder ?? 0)
          || a.termGroup.id.localeCompare(b.termGroup.id),
      ).map((term) => {
        const agreement = latestByGroup.get(term.termGroup.id);
        return TermAgreementItemDto.parseEntity(
          term,
          agreement?.isAgreed === true && agreement.term.id === term.id,
          agreement?.metadata ?? null,
        );
      }),
    });
  }
}
