import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Verification } from '#/entities/auth/verification.entity';
import { Term } from '#/entities/terms/term.entity';
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

    if (verification.isExpired) {
      await this.em.remove(verification).flush();
      throw new ApplicationError({ code: 'TOKEN_EXPIRED', status: HttpStatus.BAD_REQUEST });
    }

    const PREFIX = 'terms:';
    if (!verification.identifier.startsWith(PREFIX)) {
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.BAD_REQUEST });
    }

    const userId = verification.identifier.substring(PREFIX.length);

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
    const latestTerms = Array.from(termMap.values());
    if (latestTerms.length === 0) {
      return { terms: [] };
    }

    const agreements = await this.em.find(UserTermAgreement, {
      user: userId,
      term: { $in: latestTerms.map((t) => t.id) },
    });
    const agreedIds = new Set(agreements.map((a) => a.term.id));

    const unagreed = latestTerms.filter((term) => !agreedIds.has(term.id));

    return {
      terms: unagreed.map((term) => ({
        id: term.id,
        version: term.version,
        content: term.content,
        publishedAt: term.publishedAt ?? null,
        code: term.termGroup.code,
        title: term.termGroup.title,
        isRequired: term.termGroup.isRequired,
      })),
    };
  }
}
