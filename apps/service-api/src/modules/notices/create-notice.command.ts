import { Command } from '@nestjs/cqrs';

import type { CreateNoticeRequestDto } from '#/modules/notices/create-notice.request.dto';
import { CreateNoticeResponseDto } from '#/modules/notices/create-notice.response.dto';

export class CreateNoticeCommand extends Command<CreateNoticeResponseDto> {
  constructor(readonly input: CreateNoticeRequestDto) {
    super();
  }
}
