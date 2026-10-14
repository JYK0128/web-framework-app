import { Query } from '@nestjs/cqrs';

import type { GetPublicEventsRequestDto } from '#/modules/events/get-public-events.request.dto';
import { GetPublicEventsResponseDto } from '#/modules/events/get-public-events.response.dto';

export class GetPublicEventsQuery extends Query<GetPublicEventsResponseDto> {
  constructor(readonly input: GetPublicEventsRequestDto) {
    super();
  }
}
