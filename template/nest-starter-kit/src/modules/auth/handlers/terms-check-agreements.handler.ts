import { EntityManager } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { TermsCheckAgreementsResponseDto } from '#/modules/auth/dto/terms-check-agreements.response.dto';
import { TermsCheckAgreementsQuery } from '#/modules/auth/queries/terms-check-agreements.query';

@Injectable()
@QueryHandler(TermsCheckAgreementsQuery)
export class TermsCheckAgreementsHandler implements IQueryHandler<TermsCheckAgreementsQuery, TermsCheckAgreementsResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(query: TermsCheckAgreementsQuery): Promise<TermsCheckAgreementsResponseDto> {
    const { userId } = query.input;

    const terms = await this.em.find(
      Term,
      { publishedAt: { $ne: null, $lte: new Date() }, termGroup: { isRequired: true } },
      { populate: ['termGroup'], orderBy: { publishedAt: 'DESC' } },
    );

    const termMap = new Map<string, Term>();
    for (const t of terms) {
      if (!termMap.has(t.termGroup.id)) {
        termMap.set(t.termGroup.id, t);
      }
    }
    const latestRequired = Array.from(termMap.values());
    if (latestRequired.length === 0) {
      return { hasUnagreed: false };
    }

    const count = await this.em.count(UserTermAgreement, {
      user: userId,
      term: { $in: latestRequired.map((t) => t.id) },
    });

    return {
      hasUnagreed: count < latestRequired.length,
    };
  }
}
