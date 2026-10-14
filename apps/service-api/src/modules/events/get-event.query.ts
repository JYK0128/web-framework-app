import { Query } from '@nestjs/cqrs';

import type { GetEventRequestDto } from '#/modules/events/get-event.request.dto';
import { GetEventResponseDto } from '#/modules/events/get-event.response.dto';

export class GetEventQuery extends Query<GetEventResponseDto> {
  constructor(readonly input: GetEventRequestDto, readonly publicOnly = false) {
    super();
  }
}
