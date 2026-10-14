import { Query } from '@nestjs/cqrs';

import type { GetEventsRequestDto } from '#/modules/events/get-events.request.dto';
import { GetEventsResponseDto } from '#/modules/events/get-events.response.dto';

export class GetEventsQuery extends Query<GetEventsResponseDto> {
  constructor(readonly input: GetEventsRequestDto) {
    super();
  }
}
