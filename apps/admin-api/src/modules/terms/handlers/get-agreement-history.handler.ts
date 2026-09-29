import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { AgreementHistoryItemDto, GetAgreementHistoryResponseDto } from '#/modules/terms/interfaces';
import { GetAgreementHistoryQuery } from '#/modules/terms/queries';

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
      where: { user: userId },
      ...query.input.toCursorOptions(),
      populate: ['term', 'term.termGroup'],
    });

    return GetAgreementHistoryResponseDto.fromPlain({
      ...result,
      items: result.items.map((agreement) => AgreementHistoryItemDto.from(agreement)),
    });
  }
}
