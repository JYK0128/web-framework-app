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
    const currentUser = this.cls.get('user');
    if (!currentUser) throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });

    // 그룹별 최신 약관만 조회합니다.
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

    // 그룹별 최신 이력을 현재 상태로 사용합니다.
    const agreements = await this.em.find(
      UserTermAgreement,
      { user: currentUser.id },
      { populate: ['term', 'term.termGroup'], orderBy: { createdAt: 'DESC' } },
    );

    const agreementMap = new Map<string, UserTermAgreement>();
    for (const a of agreements) {
      if (!agreementMap.has(a.term.termGroup.id)) agreementMap.set(a.term.termGroup.id, a);
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
          sortOrder: term.termGroup.sortOrder,
          isAgreed: agreement?.isAgreed === true && agreement.term.id === term.id,
          agreedTermId: agreement?.term.id,
          agreedVersion: agreement?.term.version,
          createdAt: agreement?.createdAt ?? null,
        };
      }),
    };
  }
}
