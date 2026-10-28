import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { UserTermAgreement } from '~/core/database/entities/terms';
import { GetServiceAgreementHistoryQuery } from '~/modules/service-term/agreement/get-service-agreement-history.query';
import { GetServiceAgreementHistoryResponseDto } from '~/modules/service-term/agreement/get-service-agreement-history.response.dto';
import { ServiceAgreementHistoryItemDto } from '~/modules/service-term/agreement/service-agreement-history-item.dto';

@QueryHandler(GetServiceAgreementHistoryQuery)
export class GetServiceAgreementHistoryHandler implements IQueryHandler<GetServiceAgreementHistoryQuery, GetServiceAgreementHistoryResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetServiceAgreementHistoryQuery): Promise<GetServiceAgreementHistoryResponseDto> {
    const { where, ...options } = input.dto.toQuery();
    const result = await this.em.findByCursor(UserTermAgreement, { ...options, where: { $and: [where, { user: input.userId, term: { termGroup: input.dto.groupId } }] }, populate: ['term', 'term.termGroup'] });
    return GetServiceAgreementHistoryResponseDto.parse({ startCursor: result.startCursor, endCursor: result.endCursor, hasNextPage: result.hasNextPage, hasPrevPage: result.hasPrevPage, totalCount: result.totalCount, items: result.items.map((agreement) => ServiceAgreementHistoryItemDto.parseEntity(agreement)) });
  }
}
