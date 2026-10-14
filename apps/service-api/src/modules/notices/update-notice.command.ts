import { Command } from '@nestjs/cqrs';

import type { UpdateNoticeRequestDto } from '#/modules/notices/update-notice.request.dto';
import { UpdateNoticeResponseDto } from '#/modules/notices/update-notice.response.dto';

export class UpdateNoticeCommand extends Command<UpdateNoticeResponseDto> {
  constructor(readonly noticeId: string, readonly input: UpdateNoticeRequestDto) {
    super();
  }
}
