import { Query } from '@nestjs/cqrs';

import type { GetAgreementHistoryRequestDto } from '#/modules/term/agreement/get-agreement-history.request.dto';
import type { GetAgreementHistoryResponseDto } from '#/modules/term/agreement/get-agreement-history.response.dto';

export class GetAgreementHistoryQuery extends Query<GetAgreementHistoryResponseDto> {
  constructor(public readonly input: GetAgreementHistoryRequestDto) {
    super();
  }
}
