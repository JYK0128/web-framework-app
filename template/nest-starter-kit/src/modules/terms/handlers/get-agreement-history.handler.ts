import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SessionContext } from '#/common/contexts/session.context';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { type GetAgreementHistoryCursorRequestDto, GetAgreementHistoryCursorResponseDto } from '#/modules/terms/dto';
import { GetAgreementHistoryQuery } from '#/modules/terms/queries/get-agreement-history.query';

@Injectable()
@QueryHandler(GetAgreementHistoryQuery)
export class GetAgreementHistoryHandler implements IQueryHandler<GetAgreementHistoryQuery, GetAgreementHistoryCursorResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(query: GetAgreementHistoryQuery): Promise<GetAgreementHistoryCursorResponseDto> {
    const userId = this.sessionContext.requiredUser.id;
    const agreements = await this.identifyAgreements(userId, query.input);
    this.verify(userId, agreements);

    return this.process(agreements);
  }

  private verify(
    userId: string,
    agreements: Awaited<ReturnType<GetAgreementHistoryHandler['identifyAgreements']>>,
  ): void {
    if (!userId || !Array.isArray(agreements.items)) {
      throw new Error('약관 동의 이력을 확인할 수 없습니다.');
    }
  }

  private async identifyAgreements(userId: string, query: GetAgreementHistoryCursorRequestDto) {
    return this.em.findByCursor(
      UserTermAgreement,
      {
        where: { user: userId },
        ...query.toCursorOptions(),
        populate: ['term', 'term.termGroup'],
      },
    );
  }

  private process(agreements: Awaited<ReturnType<GetAgreementHistoryHandler['identifyAgreements']>>): GetAgreementHistoryCursorResponseDto {
    return {
      items: agreements.items.map((agreement) => ({
        id: agreement.id,
        termId: agreement.term.id,
        version: agreement.term.version,
        content: agreement.term.content,
        publishedAt: agreement.term.publishedAt ?? null,
        code: agreement.term.termGroup.code,
        title: agreement.term.termGroup.title,
        isRequired: agreement.term.termGroup.isRequired,
        isAgreed: agreement.isAgreed,
        createdAt: agreement.createdAt,
        metadata: (agreement.metadata) ?? null,
      })),
      startCursor: agreements.startCursor,
      endCursor: agreements.endCursor,
      hasNextPage: agreements.hasNextPage,
      hasPrevPage: agreements.hasPrevPage,
      totalCount: agreements.totalCount,
    };
  }
}
