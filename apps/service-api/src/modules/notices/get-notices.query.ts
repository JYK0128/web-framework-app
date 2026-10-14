import { Query } from '@nestjs/cqrs';

import type { GetNoticesRequestDto } from '#/modules/notices/get-notices.request.dto';
import { GetNoticesResponseDto } from '#/modules/notices/get-notices.response.dto';

export class GetNoticesQuery extends Query<GetNoticesResponseDto> {
  constructor(readonly input: GetNoticesRequestDto) {
    super();
  }
}
