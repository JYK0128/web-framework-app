import { Query } from '@nestjs/cqrs';

import type { GetEventsRequestDto } from '#/modules/event/get-events.request.dto';
import { GetEventsResponseDto } from '#/modules/event/get-events.response.dto';

export class GetEventsQuery extends Query<GetEventsResponseDto> {
  constructor(readonly input: GetEventsRequestDto) {
    super();
  }
}
