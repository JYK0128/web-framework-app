import { Command } from '@nestjs/cqrs';

import type { CreateNoticeRequestDto, NoticeItemDto } from '#/modules/notices/dto';

export class CreateNoticeCommand extends Command<NoticeItemDto> {
  constructor(public readonly input: CreateNoticeRequestDto) {
    super();
  }
}
