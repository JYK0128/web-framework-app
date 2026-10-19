import { Command } from '@nestjs/cqrs';

import { MarkAllNoticesReadRequestDto, type MarkAllNoticesReadResponseDto } from '#/modules/notices/dto';

export class MarkAllNoticesReadCommand extends Command<MarkAllNoticesReadResponseDto> {
  constructor(public readonly input: MarkAllNoticesReadRequestDto = new MarkAllNoticesReadRequestDto()) {
    super();
  }
}
