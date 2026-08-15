import { Query } from '@nestjs/cqrs';

import type { NoticeItemDto } from '#/modules/notices/dto';

export class GetAdminNoticeQuery extends Query<NoticeItemDto> {
  constructor(public readonly id: string) {
    super();
  }
}
