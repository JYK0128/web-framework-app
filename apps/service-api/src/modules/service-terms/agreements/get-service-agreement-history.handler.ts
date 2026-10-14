import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { UserTermAgreement } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { GetServiceAgreementHistoryQuery } from '#/modules/service-terms/agreements/get-service-agreement-history.query';
import { GetServiceAgreementHistoryResponseDto } from '#/modules/service-terms/agreements/get-service-agreement-history.response.dto';
import { ServiceAgreementHistoryItemDto } from '#/modules/service-terms/agreements/service-agreement-history-item.dto';

@QueryHandler(GetServiceAgreementHistoryQuery)
export class GetServiceAgreementHistoryHandler implements IQueryHandler<GetServiceAgreementHistoryQuery, GetServiceAgreementHistoryResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetServiceAgreementHistoryQuery): Promise<GetServiceAgreementHistoryResponseDto> {
    const result = await this.em.findByCursor(UserTermAgreement, { ...input.dto.toCursorOptions(), where: { user: input.userId, term: { termGroup: input.dto.groupId } }, populate: ['term', 'term.termGroup'] });
    return GetServiceAgreementHistoryResponseDto.parse({ startCursor: result.startCursor, endCursor: result.endCursor, hasNextPage: result.hasNextPage, hasPrevPage: result.hasPrevPage, totalCount: result.totalCount, items: result.items.map((agreement) => ServiceAgreementHistoryItemDto.parseEntity(agreement)) });
  }
}
