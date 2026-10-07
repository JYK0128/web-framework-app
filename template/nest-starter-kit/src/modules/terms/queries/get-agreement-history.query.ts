import { Query } from '@nestjs/cqrs';

import type { GetAgreementHistoryRequestDto } from '#/modules/terms/dto/get-agreement-history.request.dto';
import { GetAgreementHistoryResponseDto } from '#/modules/terms/dto/get-agreement-history.response.dto';

export interface GetAgreementHistoryPayload {
  query: GetAgreementHistoryRequestDto
}

export class GetAgreementHistoryQuery extends Query<GetAgreementHistoryResponseDto> {
  constructor(public readonly input: GetAgreementHistoryPayload) {
    super();
  }
}
