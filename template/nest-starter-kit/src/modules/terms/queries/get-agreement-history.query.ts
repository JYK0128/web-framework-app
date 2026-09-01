import { Query } from '@nestjs/cqrs';

import type { GetAgreementHistoryCursorRequestDto } from '#/modules/terms/dto/get-agreement-history-cursor.request.dto';
import { GetAgreementHistoryCursorResponseDto } from '#/modules/terms/dto/get-agreement-history-cursor.response.dto';

export class GetAgreementHistoryQuery extends Query<GetAgreementHistoryCursorResponseDto> {
  constructor(public readonly input: GetAgreementHistoryCursorRequestDto) {
    super();
  }
}
