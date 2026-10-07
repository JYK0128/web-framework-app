import { Query } from '@nestjs/cqrs';

import type { AgreementHistoryCursorResponseDto, GetAgreementHistoryRequestDto } from '#/modules/terms/interfaces';

export class GetAgreementHistoryQuery extends Query<AgreementHistoryCursorResponseDto> {
  constructor(public readonly input: GetAgreementHistoryRequestDto) {
    super();
  }
}
