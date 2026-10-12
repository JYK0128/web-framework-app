import { Command } from '@nestjs/cqrs';

import type { CreateTermRequestDto } from '#/modules/terms/documents/create-term.request.dto';
import type { CreateTermResponseDto } from '#/modules/terms/documents/create-term.response.dto';

export class CreateTermCommand extends Command<CreateTermResponseDto> {
  constructor(public readonly input: CreateTermRequestDto) {
    super();
  }
}
