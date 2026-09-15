import { Command } from '@nestjs/cqrs';

import type { DeleteNoticeResponseDto } from '#/modules/notices/dto';

export interface DeleteNoticePayload {
  noticeId: string
}

export class DeleteNoticeCommand extends Command<DeleteNoticeResponseDto> {
  constructor(public readonly input: DeleteNoticePayload) {
    super();
  }
}
