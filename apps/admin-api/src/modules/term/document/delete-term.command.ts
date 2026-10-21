import { Command } from '@nestjs/cqrs';

import type { DeleteTermRequestDto } from '~/modules/term/document/delete-term.request.dto';
import type { DeleteTermResponseDto } from '~/modules/term/document/delete-term.response.dto';

export class DeleteTermCommand extends Command<DeleteTermResponseDto> {
  constructor(public readonly input: DeleteTermRequestDto) {
    super();
  }
}
