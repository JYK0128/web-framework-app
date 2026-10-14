import { Command } from '@nestjs/cqrs';

import type { DeleteNoticeRequestDto } from '#/modules/notices/delete-notice.request.dto';
import { DeleteNoticeResponseDto } from '#/modules/notices/delete-notice.response.dto';

export class DeleteNoticeCommand extends Command<DeleteNoticeResponseDto> {
  constructor(readonly input: DeleteNoticeRequestDto) {
    super();
  }
}
