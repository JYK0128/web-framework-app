import { Command } from '@nestjs/cqrs';

import type { CreateTermGroupRequestDto, TermGroupItemDto } from '#/modules/terms/dto';

export class CreateTermGroupCommand extends Command<TermGroupItemDto> {
  constructor(public readonly input: CreateTermGroupRequestDto) {
    super();
  }
}
