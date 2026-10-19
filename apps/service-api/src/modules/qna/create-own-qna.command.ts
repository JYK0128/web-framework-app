import { Command } from '@nestjs/cqrs';

import type { CreateQnaRequestDto } from '#/modules/qna/create-qna.request.dto';
import { CreateQnaResponseDto } from '#/modules/qna/create-qna.response.dto';

export class CreateOwnQnaCommand extends Command<CreateQnaResponseDto> {
  constructor(public readonly input: CreateQnaRequestDto) {
    super();
  }
}
