import { Command } from '@nestjs/cqrs';

import type { NoticeItemDto } from '#/modules/notices/dto';

export interface DeleteNoticePayload {
  id: string
  deletedBy?: string
}

export class DeleteNoticeCommand extends Command<NoticeItemDto> {
  constructor(public readonly input: DeleteNoticePayload) {
    super();
  }
}
