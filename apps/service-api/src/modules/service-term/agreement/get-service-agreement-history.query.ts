import { Query } from '@nestjs/cqrs';

import type { GetServiceAgreementHistoryRequestDto } from '~/modules/service-term/agreement/get-service-agreement-history.request.dto';
import { GetServiceAgreementHistoryResponseDto } from '~/modules/service-term/agreement/get-service-agreement-history.response.dto';

export class GetServiceAgreementHistoryQuery extends Query<GetServiceAgreementHistoryResponseDto> {
  constructor(public readonly input: { userId: string, dto: GetServiceAgreementHistoryRequestDto }) {
    super();
  }
}
