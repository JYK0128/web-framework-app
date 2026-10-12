import { Command } from '@nestjs/cqrs';

import type { UpdateTermRequestDto } from '#/modules/terms/documents/update-term.request.dto';
import type { UpdateTermResponseDto } from '#/modules/terms/documents/update-term.response.dto';

export class UpdateTermCommand extends Command<UpdateTermResponseDto> {
  constructor(public readonly input: { termId: string, data: UpdateTermRequestDto }) {
    super();
  }
}
