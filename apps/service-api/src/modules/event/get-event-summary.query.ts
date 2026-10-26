import { Query } from '@nestjs/cqrs';

import type { GetEventSummaryRequestDto } from '~/modules/event/get-event-summary.request.dto';
import { GetEventSummaryResponseDto } from '~/modules/event/get-event-summary.response.dto';

export class GetEventSummaryQuery extends Query<GetEventSummaryResponseDto> {
  constructor(public readonly input: GetEventSummaryRequestDto) {
    super();
  }
}
