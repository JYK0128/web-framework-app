import { Command } from '@nestjs/cqrs';

import type { NoticeItemDto, UpdateNoticeRequestDto } from '#/modules/notices/dto';

export class UpdateNoticeCommand extends Command<NoticeItemDto> {
  constructor(
    public readonly id: string,
    public readonly input: UpdateNoticeRequestDto,
  ) {
    super();
  }
}
