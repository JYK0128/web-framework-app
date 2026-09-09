import { Command } from '@nestjs/cqrs';

import type { CreateResourceRequestDto, CreateResourceResponseDto } from '#/modules/resources/dto';

export class CreateResourceCommand extends Command<CreateResourceResponseDto> {
  constructor(public readonly input: CreateResourceRequestDto) {
    super();
  }
}
