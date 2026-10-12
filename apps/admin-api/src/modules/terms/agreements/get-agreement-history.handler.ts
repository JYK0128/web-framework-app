import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { UserTermAgreement } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { AgreementHistoryItemDto } from '#/modules/terms/agreements/agreement-history-item.dto';
import { GetAgreementHistoryQuery } from '#/modules/terms/agreements/get-agreement-history.query';
import { GetAgreementHistoryResponseDto } from '#/modules/terms/agreements/get-agreement-history.response.dto';

@Injectable()
@QueryHandler(GetAgreementHistoryQuery)
export class GetAgreementHistoryHandler implements IQueryHandler<GetAgreementHistoryQuery, GetAgreementHistoryResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly principalContext: PrincipalContext,
  ) {}

  async execute(query: GetAgreementHistoryQuery): Promise<GetAgreementHistoryResponseDto> {
    const userId = this.principalContext.ensureUser().id;
    const result = await this.em.findByCursor(UserTermAgreement, {
      where: { user: userId, ...(query.input.groupId ? { term: { termGroup: query.input.groupId } } : {}) },
      ...query.input.toCursorOptions(),
      populate: ['term', 'term.termGroup'],
    });

    return GetAgreementHistoryResponseDto.parse({
      ...result,
      items: result.items.map((agreement) => AgreementHistoryItemDto.parseEntity(agreement)),
    });
  }
}
