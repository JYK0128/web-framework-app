import { EntityManager } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term, TermStatus } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { TermsValidateAgreementsResponseDto } from '#/modules/auth/dto/terms-validate-agreements.response.dto';
import { TermsValidateAgreementsQuery } from '#/modules/auth/queries/terms-validate-agreements.query';

@Injectable()
@QueryHandler(TermsValidateAgreementsQuery)
export class TermsValidateAgreementsHandler implements IQueryHandler<TermsValidateAgreementsQuery, TermsValidateAgreementsResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(query: TermsValidateAgreementsQuery): Promise<TermsValidateAgreementsResponseDto> {
    const { userId } = query.input;

    // 1. Find all active required terms (where the parent group isRequired = true, and term status = PUBLISHED)
    const terms = await this.em.find(
      Term,
      {
        status: TermStatus.PUBLISHED,
        termGroup: { isRequired: true },
      },
      { populate: ['termGroup'], orderBy: { publishedAt: 'DESC' } },
    );

    const latestTermsMap = new Map<string, Term>();
    for (const term of terms) {
      if (!latestTermsMap.has(term.termGroup.id)) {
        latestTermsMap.set(term.termGroup.id, term);
      }
    }
    const requiredTerms = Array.from(latestTermsMap.values());

    if (requiredTerms.length === 0) {
      return { hasUnagreedTerms: false, unagreedTermIds: [] };
    }

    // 2. Find agreements by user
    const agreements = await this.em.find(UserTermAgreement, {
      user: userId,
      term: { $in: requiredTerms.map((t) => t.id) },
    });

    const agreedTermIds = new Set(agreements.map((a) => a.term.id));

    // 3. Check what's missing
    const unagreedTermIds = requiredTerms
      .filter((term) => !agreedTermIds.has(term.id))
      .map((term) => term.id);

    return {
      hasUnagreedTerms: unagreedTermIds.length > 0,
      unagreedTermIds,
    };
  }
}
