import { Command } from '@nestjs/cqrs';

import type { UpdateNoticeRequestDto, UpdateNoticeResponseDto } from '#/modules/notices/dto';

export interface UpdateNoticePayload {
  id: string
  input: UpdateNoticeRequestDto
}

export class UpdateNoticeCommand extends Command<UpdateNoticeResponseDto> {
  constructor(public readonly input: UpdateNoticePayload) {
    super();
  }
}
