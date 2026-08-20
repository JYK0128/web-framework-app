import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { AppEntityManager } from '#/database/entity-manager';
import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { GetAgreementsResponseDto } from '#/modules/terms/dto/get-agreements.response.dto';
import { GetAgreementsQuery } from '#/modules/terms/queries/get-agreements.query';

@Injectable()
@QueryHandler(GetAgreementsQuery)
export class GetAgreementsHandler implements IQueryHandler<GetAgreementsQuery, GetAgreementsResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
  ) {}

  async execute(_query: GetAgreementsQuery): Promise<GetAgreementsResponseDto> {
    const userId = this.identifyUserId();
    const terms = await this.identifyTerms();
    const agreementMap = await this.identifyAgreementMap(userId);

    return this.process(terms, agreementMap);
  }

  private identifyUserId(): string {
    const sessionUser = this.requestContext.request?.session.user;
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    return sessionUser.id;
  }

  private async identifyTerms(): Promise<Term[]> {
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
    return Array.from(termMap.values()).sort(
      (a, b) => (a.termGroup.sortOrder ?? 0) - (b.termGroup.sortOrder ?? 0),
    );
  }

  private async identifyAgreementMap(userId: string): Promise<Map<string, UserTermAgreement>> {
    const agreements = await this.em.find(
      UserTermAgreement,
      { user: userId },
      { populate: ['term', 'term.termGroup'], orderBy: { createdAt: 'DESC' } },
    );

    const map = new Map<string, UserTermAgreement>();
    for (const a of agreements) {
      if (!map.has(a.term.termGroup.id)) {
        map.set(a.term.termGroup.id, a);
      }
    }
    return map;
  }

  private process(
    terms: Term[],
    agreementMap: Map<string, UserTermAgreement>,
  ): GetAgreementsResponseDto {
    return {
      terms: terms.map((term) => {
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
