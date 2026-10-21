import { Command } from '@nestjs/cqrs';

import type { UpdateOwnQnaRequestDto } from '~/modules/qna/update-own-qna.request.dto';
import { UpdateOwnQnaResponseDto } from '~/modules/qna/update-own-qna.response.dto';

export class UpdateOwnQnaCommand extends Command<UpdateOwnQnaResponseDto> {
  constructor(public readonly input: { qnaId: string, dto: UpdateOwnQnaRequestDto }) {
    super();
  }
}
