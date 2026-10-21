import { Command } from '@nestjs/cqrs';

import type { CreateNoticeRequestDto } from '~/modules/notice/create-notice.request.dto';
import { CreateNoticeResponseDto } from '~/modules/notice/create-notice.response.dto';

export class CreateNoticeCommand extends Command<CreateNoticeResponseDto> {
  constructor(readonly input: CreateNoticeRequestDto) {
    super();
  }
}
