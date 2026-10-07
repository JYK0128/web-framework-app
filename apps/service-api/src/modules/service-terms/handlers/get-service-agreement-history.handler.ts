import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { ServiceAgreementHistoryCursorResponseDto, ServiceAgreementHistoryItemDto } from '#/modules/service-terms/dto';
import { GetServiceAgreementHistoryQuery } from '#/modules/service-terms/queries';

@QueryHandler(GetServiceAgreementHistoryQuery)
export class GetServiceAgreementHistoryHandler implements IQueryHandler<GetServiceAgreementHistoryQuery, ServiceAgreementHistoryCursorResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetServiceAgreementHistoryQuery): Promise<ServiceAgreementHistoryCursorResponseDto> {
    const result = await this.em.findByCursor(UserTermAgreement, { ...input.dto.toCursorOptions(), where: { user: input.userId, term: { termGroup: input.dto.groupId } }, populate: ['term', 'term.termGroup'] });
    return ServiceAgreementHistoryCursorResponseDto.fromPlain({ startCursor: result.startCursor, endCursor: result.endCursor, hasNextPage: result.hasNextPage, hasPrevPage: result.hasPrevPage, totalCount: result.totalCount, items: result.items.map((agreement) => ServiceAgreementHistoryItemDto.from(agreement)) });
  }
}
