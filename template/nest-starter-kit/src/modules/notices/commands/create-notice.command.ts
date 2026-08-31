import { Command } from '@nestjs/cqrs';

import type { CreateNoticeRequestDto, CreateNoticeResponseDto } from '#/modules/notices/dto';

export class CreateNoticeCommand extends Command<CreateNoticeResponseDto> {
  constructor(public readonly input: CreateNoticeRequestDto) {
    super();
  }
}
