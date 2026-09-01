import { Command } from '@nestjs/cqrs';

import type { MarkNoticeReadResponseDto } from '#/modules/notices/dto';

export interface MarkNoticeReadPayload {
  id: string
  userId: string
}

export class MarkNoticeReadCommand extends Command<MarkNoticeReadResponseDto> {
  constructor(public readonly input: MarkNoticeReadPayload) {
    super();
  }
}
