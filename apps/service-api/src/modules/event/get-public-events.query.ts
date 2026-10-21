import { Query } from '@nestjs/cqrs';

import type { GetPublicEventsRequestDto } from '~/modules/event/get-public-events.request.dto';
import { GetPublicEventsResponseDto } from '~/modules/event/get-public-events.response.dto';

export class GetPublicEventsQuery extends Query<GetPublicEventsResponseDto> {
  constructor(readonly input: GetPublicEventsRequestDto) {
    super();
  }
}
