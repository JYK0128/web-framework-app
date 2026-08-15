import { Command } from '@nestjs/cqrs';

import type { NoticeItemDto } from '#/modules/notices/dto';

export class DeleteNoticeCommand extends Command<NoticeItemDto> {
  constructor(
    public readonly id: string,
    public readonly deletedBy: string,
  ) {
    super();
  }
}
