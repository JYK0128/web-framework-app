import { Command } from '@nestjs/cqrs';

import type { DeleteNoticeRequestDto } from '~/modules/notice/delete-notice.request.dto';
import { DeleteNoticeResponseDto } from '~/modules/notice/delete-notice.response.dto';

export class DeleteNoticeCommand extends Command<DeleteNoticeResponseDto> {
  constructor(readonly input: DeleteNoticeRequestDto) {
    super();
  }
}
