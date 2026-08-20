import { Command } from '@nestjs/cqrs';

import type { MarkNoticeReadResponseDto } from '#/modules/notices/dto';

export interface MarkAllNoticesReadPayload {
  userId: string
}

export class MarkAllNoticesReadCommand extends Command<MarkNoticeReadResponseDto> {
  constructor(public readonly input: MarkAllNoticesReadPayload) {
    super();
  }
}
