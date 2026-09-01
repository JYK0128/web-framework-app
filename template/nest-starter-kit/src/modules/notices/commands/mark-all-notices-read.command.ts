import { Command } from '@nestjs/cqrs';

import type { MarkAllNoticesReadResponseDto } from '#/modules/notices/dto';

export interface MarkAllNoticesReadPayload {
  userId: string
}

export class MarkAllNoticesReadCommand extends Command<MarkAllNoticesReadResponseDto> {
  constructor(public readonly input: MarkAllNoticesReadPayload) {
    super();
  }
}
