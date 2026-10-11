import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { UserTermAgreement } from '#/core/database/entities/terms/user-term-agreement.entity';
import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { AgreementHistoryCursorResponseDto, AgreementHistoryItemDto } from '#/modules/terms/dto';
import { GetAgreementHistoryQuery } from '#/modules/terms/queries';

@Injectable()
@QueryHandler(GetAgreementHistoryQuery)
export class GetAgreementHistoryHandler implements IQueryHandler<GetAgreementHistoryQuery, AgreementHistoryCursorResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly principalContext: PrincipalContext,
  ) {}

  async execute(query: GetAgreementHistoryQuery): Promise<AgreementHistoryCursorResponseDto> {
    const userId = this.principalContext.ensureUser().id;
    const result = await this.em.findByCursor(UserTermAgreement, {
      where: { user: userId, ...(query.input.groupId ? { term: { termGroup: query.input.groupId } } : {}) },
      ...query.input.toCursorOptions(),
      populate: ['term', 'term.termGroup'],
    });

    return AgreementHistoryCursorResponseDto.fromPlain({
      ...result,
      items: result.items.map((agreement) => AgreementHistoryItemDto.from(agreement)),
    });
  }
}
