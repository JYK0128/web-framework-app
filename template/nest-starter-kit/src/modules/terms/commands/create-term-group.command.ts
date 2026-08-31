import { Command } from '@nestjs/cqrs';

import type { CreateTermGroupRequestDto, CreateTermGroupResponseDto } from '#/modules/terms/dto';

export class CreateTermGroupCommand extends Command<CreateTermGroupResponseDto> {
  constructor(public readonly input: CreateTermGroupRequestDto) {
    super();
  }
}
