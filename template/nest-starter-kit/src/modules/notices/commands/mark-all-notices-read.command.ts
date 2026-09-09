import { Command } from '@nestjs/cqrs';

import type { MarkAllNoticesReadResponseDto } from '#/modules/notices/dto';

export class MarkAllNoticesReadCommand extends Command<MarkAllNoticesReadResponseDto> {
  constructor() {
    super();
  }
}
