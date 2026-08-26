import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { type GetAgreementHistoryCursorRequestDto, GetAgreementHistoryCursorResponseDto } from '#/modules/terms/dto';
import { GetAgreementHistoryQuery } from '#/modules/terms/queries/get-agreement-history.query';

@Injectable()
@QueryHandler(GetAgreementHistoryQuery)
export class GetAgreementHistoryHandler implements IQueryHandler<GetAgreementHistoryQuery, GetAgreementHistoryCursorResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
  ) {}

  async execute(query: GetAgreementHistoryQuery): Promise<GetAgreementHistoryCursorResponseDto> {
    const userId = this.identifyUserId();
    const agreements = await this.identifyAgreements(userId, query.input);

    return this.process(agreements);
  }

  private identifyUserId(): string {
    const sessionUser = this.requestContext.request?.session.user;
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    return sessionUser.id;
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
      })),
      startCursor: agreements.startCursor,
      endCursor: agreements.endCursor,
      hasNextPage: agreements.hasNextPage,
      hasPrevPage: agreements.hasPrevPage,
      totalCount: agreements.totalCount,
    };
  }
}
