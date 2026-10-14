import { Command } from '@nestjs/cqrs';

import type { CreateTermRequestDto } from '#/modules/term/document/create-term.request.dto';
import type { CreateTermResponseDto } from '#/modules/term/document/create-term.response.dto';

export class CreateTermCommand extends Command<CreateTermResponseDto> {
  constructor(public readonly input: CreateTermRequestDto) {
    super();
  }
}
