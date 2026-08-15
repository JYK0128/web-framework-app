import { Command } from '@nestjs/cqrs';

import type { MarkNoticeReadResponseDto } from '#/modules/notices/dto';

export class MarkAllNoticesReadCommand extends Command<MarkNoticeReadResponseDto> {
  constructor(public readonly userId: string) {
    super();
  }
}
