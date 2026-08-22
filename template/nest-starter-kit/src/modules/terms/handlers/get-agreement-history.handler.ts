import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetAgreementHistoryResponseDto } from '#/modules/terms/dto/get-agreement-history.response.dto';
import { GetAgreementHistoryQuery } from '#/modules/terms/queries/get-agreement-history.query';

@Injectable()
@QueryHandler(GetAgreementHistoryQuery)
export class GetAgreementHistoryHandler implements IQueryHandler<GetAgreementHistoryQuery, GetAgreementHistoryResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
  ) {}

  async execute(_query: GetAgreementHistoryQuery): Promise<GetAgreementHistoryResponseDto> {
    const userId = this.identifyUserId();
    const agreements = await this.identifyAgreements(userId);

    return this.process(agreements);
  }

  private identifyUserId(): string {
    const sessionUser = this.requestContext.request?.session.user;
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    return sessionUser.id;
  }

  private async identifyAgreements(userId: string): Promise<UserTermAgreement[]> {
    return this.em.find(
      UserTermAgreement,
      { user: userId },
      {
        populate: ['term', 'term.termGroup'],
        orderBy: { createdAt: 'DESC' },
      },
    );
  }

  private process(agreements: UserTermAgreement[]): GetAgreementHistoryResponseDto {
    return {
      items: agreements.map((agreement) => ({
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
    };
  }
}
