import { Query } from '@nestjs/cqrs';

import type { GetEventSummaryAggregationRequestDto, GetEventSummaryRequestDto } from '~/modules/event/get-event-summary.request.dto';
import { GetEventSummaryResponseDto } from '~/modules/event/get-event-summary.response.dto';

export class GetEventSummaryQuery extends Query<GetEventSummaryResponseDto> {
  constructor(
    public readonly request: GetEventSummaryRequestDto,
    public readonly aggregation: GetEventSummaryAggregationRequestDto,
  ) {
    super();
  }
}
