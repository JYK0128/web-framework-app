import { Command } from '@nestjs/cqrs';

import type { DeleteOwnQnaRequestDto } from '~/modules/qna/delete-own-qna.request.dto';
import { DeleteOwnQnaResponseDto } from '~/modules/qna/delete-own-qna.response.dto';

export class DeleteOwnQnaCommand extends Command<DeleteOwnQnaResponseDto> {
  constructor(public readonly input: DeleteOwnQnaRequestDto) {
    super();
  }
}
