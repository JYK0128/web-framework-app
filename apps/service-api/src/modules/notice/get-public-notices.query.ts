import { Query } from '@nestjs/cqrs';

import type { GetPublicNoticesRequestDto } from '~/modules/notice/get-public-notices.request.dto';
import { GetPublicNoticesResponseDto } from '~/modules/notice/get-public-notices.response.dto';

export class GetPublicNoticesQuery extends Query<GetPublicNoticesResponseDto> {
  constructor(readonly input: GetPublicNoticesRequestDto) {
    super();
  }
}
