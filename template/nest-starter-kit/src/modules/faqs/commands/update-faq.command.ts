import { Command } from '@nestjs/cqrs';

import type { FaqItemDto, UpdateFaqRequestDto } from '#/modules/faqs/dto';

export class UpdateFaqCommand extends Command<FaqItemDto> {
  constructor(
    public readonly id: string,
    public readonly input: UpdateFaqRequestDto,
  ) {
    super();
  }
}
