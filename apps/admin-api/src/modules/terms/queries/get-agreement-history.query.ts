import { Query } from '@nestjs/cqrs';

import type { GetAgreementHistoryRequestDto, GetAgreementHistoryResponseDto } from '#/modules/terms/interfaces';

export class GetAgreementHistoryQuery extends Query<GetAgreementHistoryResponseDto> {
  constructor(public readonly input: GetAgreementHistoryRequestDto) {
    super();
  }
}
