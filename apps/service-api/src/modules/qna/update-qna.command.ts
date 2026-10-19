import { Command } from '@nestjs/cqrs';

import type { UpdateQnaRequestDto } from '#/modules/qna/update-qna.request.dto';
import { UpdateQnaResponseDto } from '#/modules/qna/update-qna.response.dto';

export class UpdateQnaCommand extends Command<UpdateQnaResponseDto> {
  constructor(public readonly input: { qnaId: string, dto: UpdateQnaRequestDto }) {
    super();
  }
}
