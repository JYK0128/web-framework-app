import { Query } from '@nestjs/cqrs';

import type { GetEventRequestDto } from '~/modules/event/get-event.request.dto';
import { GetEventResponseDto } from '~/modules/event/get-event.response.dto';

export class GetEventQuery extends Query<GetEventResponseDto> {
  constructor(readonly input: GetEventRequestDto, readonly publicOnly = false) {
    super();
  }
}
