import { Command } from '@nestjs/cqrs';

import type { DeleteTermRequestDto } from '#/modules/terms/documents/delete-term.request.dto';
import type { DeleteTermResponseDto } from '#/modules/terms/documents/delete-term.response.dto';

export class DeleteTermCommand extends Command<DeleteTermResponseDto> {
  constructor(public readonly input: DeleteTermRequestDto) {
    super();
  }
}
