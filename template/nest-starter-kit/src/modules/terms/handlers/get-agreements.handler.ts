import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { GetAgreementsResponseDto } from '#/modules/terms/dto/get-agreements.response.dto';
import { GetAgreementsQuery } from '#/modules/terms/queries/get-agreements.query';

@Injectable()
@QueryHandler(GetAgreementsQuery)
export class GetAgreementsHandler implements IQueryHandler<GetAgreementsQuery, GetAgreementsResponseDto> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(_query: GetAgreementsQuery): Promise<GetAgreementsResponseDto> {
    const sessionUser = this.cls.get('user');
    if (!sessionUser) throw new ApplicationError({ code: 'UNAUTHORIZED', status: HttpStatus.UNAUTHORIZED });

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

    const agreements = await this.em.find(
      UserTermAgreement,
      { user: sessionUser.id },
      { populate: ['term', 'term.termGroup'] },
    );

    const agreementMap = new Map<string, UserTermAgreement>();
    for (const a of agreements) {
      agreementMap.set(a.term.termGroup.id, a);
    }

    return {
      terms: latestTerms.map((term) => {
        const agreement = agreementMap.get(term.termGroup.id);
        return {
          id: term.id,
          version: term.version,
          content: term.content,
          publishedAt: term.publishedAt ?? null,
          code: term.termGroup.code,
          title: term.termGroup.title,
          isRequired: term.termGroup.isRequired,
          isAgreed: !!agreement,
          agreedTermId: agreement?.term.id,
          agreedVersion: agreement?.term.version,
          agreedAt: agreement?.agreedAt ?? null,
        };
      }),
    };
  }
}
