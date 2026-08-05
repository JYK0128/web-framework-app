import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Verification } from '#/entities/auth/verification.entity';
import { Term, TermStatus } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { TermsChallengeListResponseDto } from '#/modules/auth/dto/terms-challenge-list.response.dto';
import { TermsChallengeListQuery } from '#/modules/auth/queries/terms-challenge-list.query';

@Injectable()
@QueryHandler(TermsChallengeListQuery)
export class TermsChallengeListHandler implements IQueryHandler<TermsChallengeListQuery, TermsChallengeListResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(query: TermsChallengeListQuery): Promise<TermsChallengeListResponseDto> {
    const { token } = query.input;

    const verification = await this.em.findOne(Verification, { value: token });
    if (!verification) {
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.BAD_REQUEST });
    }

    if (verification.expiresAt < new Date()) {
      await this.em.remove(verification).flush();
      throw new ApplicationError({ code: 'TOKEN_EXPIRED', status: HttpStatus.BAD_REQUEST });
    }

    const identifierPrefix = 'terms:';
    if (!verification.identifier.startsWith(identifierPrefix)) {
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.BAD_REQUEST });
    }

    const userId = verification.identifier.substring(identifierPrefix.length);

    // 1. Find all active terms (published)
    const terms = await this.em.find(
      Term,
      {
        status: TermStatus.PUBLISHED,
      },
      { populate: ['termGroup'], orderBy: { publishedAt: 'DESC' } },
    );

    const latestTermsMap = new Map<string, Term>();
    for (const term of terms) {
      if (!latestTermsMap.has(term.termGroup.id)) {
        latestTermsMap.set(term.termGroup.id, term);
      }
    }
    const publishedTerms = Array.from(latestTermsMap.values());

    if (publishedTerms.length === 0) {
      return { terms: [] };
    }

    // 2. Find agreements by user
    const agreements = await this.em.find(UserTermAgreement, {
      user: userId,
      term: { $in: publishedTerms.map((t) => t.id) },
    });

    const agreedTermIds = new Set(agreements.map((a) => a.term.id));

    // 3. Filter unagreed terms
    const unagreedTerms = publishedTerms.filter((term) => !agreedTermIds.has(term.id));

    return {
      terms: unagreedTerms.map((term) => ({
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
