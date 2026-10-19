import { Query } from '@nestjs/cqrs';

import type { GetNoticesRequestDto } from '#/modules/notice/get-notices.request.dto';
import { GetNoticesResponseDto } from '#/modules/notice/get-notices.response.dto';

export class GetNoticesQuery extends Query<GetNoticesResponseDto> {
  constructor(readonly input: GetNoticesRequestDto) {
    super();
  }
}
