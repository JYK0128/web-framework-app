import { Command } from '@nestjs/cqrs';

import type { UpdateNoticeRequestDto } from '~/modules/notice/update-notice.request.dto';
import { UpdateNoticeResponseDto } from '~/modules/notice/update-notice.response.dto';

export class UpdateNoticeCommand extends Command<UpdateNoticeResponseDto> {
  constructor(readonly noticeId: string, readonly input: UpdateNoticeRequestDto) {
    super();
  }
}
