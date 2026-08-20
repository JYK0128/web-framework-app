import { Query } from '@nestjs/cqrs';

import type { NoticeItemDto } from '#/modules/notices/dto';

export interface GetAdminNoticePayload {
  id: string
}

export class GetAdminNoticeQuery extends Query<NoticeItemDto> {
  constructor(public readonly input: GetAdminNoticePayload) {
    super();
  }
}
