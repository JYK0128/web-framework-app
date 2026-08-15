import { Command } from '@nestjs/cqrs';

import type { MarkNoticeReadResponseDto } from '#/modules/notices/dto';

export class MarkNoticeReadCommand extends Command<MarkNoticeReadResponseDto> {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {
    super();
  }
}
