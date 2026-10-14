import { Query } from '@nestjs/cqrs';

import type { GetPublicNoticesRequestDto } from '#/modules/notices/get-public-notices.request.dto';
import { GetPublicNoticesResponseDto } from '#/modules/notices/get-public-notices.response.dto';

export class GetPublicNoticesQuery extends Query<GetPublicNoticesResponseDto> {
  constructor(readonly input: GetPublicNoticesRequestDto) {
    super();
  }
}
