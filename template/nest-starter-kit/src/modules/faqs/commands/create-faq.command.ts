import { Command } from '@nestjs/cqrs';

import type { CreateFaqRequestDto, CreateFaqResponseDto } from '#/modules/faqs/dto';

export class CreateFaqCommand extends Command<CreateFaqResponseDto> {
  constructor(public readonly input: CreateFaqRequestDto) {
    super();
  }
}
