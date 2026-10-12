import { Command } from '@nestjs/cqrs';

import type { CreateTermRequestDto, CreateTermResponseDto } from '#/modules/terms';

export class CreateTermCommand extends Command<CreateTermResponseDto> {
  constructor(public readonly input: CreateTermRequestDto) {
    super();
  }
}
