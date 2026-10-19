import { Command } from '@nestjs/cqrs';

import type { DeleteQnaRequestDto } from '#/modules/qna/delete-qna.request.dto';
import { DeleteQnaResponseDto } from '#/modules/qna/delete-qna.response.dto';

export class DeleteQnaCommand extends Command<DeleteQnaResponseDto> {
  constructor(public readonly input: DeleteQnaRequestDto) {
    super();
  }
}
