import { Query } from '@nestjs/cqrs';

import type { GetNoticeRequestDto } from '#/modules/notice/get-notice.request.dto';
import { GetNoticeResponseDto } from '#/modules/notice/get-notice.response.dto';

export class GetNoticeQuery extends Query<GetNoticeResponseDto> {
  constructor(readonly input: GetNoticeRequestDto, readonly publicOnly = false) {
    super();
  }
}
