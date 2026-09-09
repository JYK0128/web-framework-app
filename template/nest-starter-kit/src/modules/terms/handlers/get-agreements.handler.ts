import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SessionContext } from '#/common/contexts/session.context';
import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { AgreementDto } from '#/modules/terms/dto/agreement.dto';
import { GetAgreementsResponseDto } from '#/modules/terms/dto/get-agreements.response.dto';
import { GetAgreementsQuery } from '#/modules/terms/queries/get-agreements.query';

@Injectable()
@QueryHandler(GetAgreementsQuery)
export class GetAgreementsHandler implements IQueryHandler<GetAgreementsQuery, GetAgreementsResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(_query: GetAgreementsQuery): Promise<GetAgreementsResponseDto> {
    const userId = this.sessionContext.requiredUser.id;
    const terms = await this.identifyTerms();
    const agreementMap = await this.identifyAgreementMap(userId);
    this.verify(userId, terms, agreementMap);

    return this.process(terms, agreementMap);
  }

  private verify(userId: string, terms: Term[], agreementMap: Map<string, UserTermAgreement>): void {
    if (!userId || !Array.isArray(terms) || !(agreementMap instanceof Map)) {
      throw new Error('약관 동의 정보를 확인할 수 없습니다.');
    }
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
      items: terms.map((term) => new AgreementDto(term, agreementMap.get(term.termGroup.id))),
    };
  }
}
