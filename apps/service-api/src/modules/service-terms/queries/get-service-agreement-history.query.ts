import { Query } from '@nestjs/cqrs';

import type { GetServiceAgreementHistoryRequestDto, ServiceAgreementHistoryCursorResponseDto } from '#/modules/service-terms/dto';

export class GetServiceAgreementHistoryQuery extends Query<ServiceAgreementHistoryCursorResponseDto> {
  constructor(public readonly input: { userId: string, dto: GetServiceAgreementHistoryRequestDto }) {
    super();
  }
}
