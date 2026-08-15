import { Command } from '@nestjs/cqrs';

import type { CreateFaqRequestDto, FaqItemDto } from '#/modules/faqs/dto';

export class CreateFaqCommand extends Command<FaqItemDto> {
  constructor(public readonly input: CreateFaqRequestDto) {
    super();
  }
}
