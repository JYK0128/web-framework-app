import { Command } from '@nestjs/cqrs';

import type { UpdateTermRequestDto } from '~/modules/term/document/update-term.request.dto';
import type { UpdateTermResponseDto } from '~/modules/term/document/update-term.response.dto';

export class UpdateTermCommand extends Command<UpdateTermResponseDto> {
  constructor(public readonly input: { termId: string, data: UpdateTermRequestDto }) {
    super();
  }
}
