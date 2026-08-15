import { Command } from '@nestjs/cqrs';

import type { AdminTermDto, CreateTermRequestDto } from '#/modules/terms/dto';

export class CreateTermCommand extends Command<AdminTermDto> {
  constructor(public readonly input: CreateTermRequestDto) {
    super();
  }
}
