import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';

import { UserTermAgreement } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { AgreementHistoryItemDto } from '#/modules/term/agreement/agreement-history-item.dto';
import { GetAgreementHistoryQuery } from '#/modules/term/agreement/get-agreement-history.query';
import { GetAgreementHistoryResponseDto } from '#/modules/term/agreement/get-agreement-history.response.dto';

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
