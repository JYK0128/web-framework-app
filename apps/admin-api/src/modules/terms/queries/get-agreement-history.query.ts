import { Query } from '@nestjs/cqrs';

import type { AgreementHistoryCursorResponseDto, GetAgreementHistoryRequestDto } from '#/modules/terms/dto';

export class GetAgreementHistoryQuery extends Query<AgreementHistoryCursorResponseDto> {
  constructor(public readonly input: GetAgreementHistoryRequestDto) {
    super();
  }
}
