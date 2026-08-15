import { Command } from '@nestjs/cqrs';

import type { FaqItemDto } from '#/modules/faqs/dto';

export class MarkHelpfulFaqCommand extends Command<FaqItemDto> {
  constructor(public readonly id: string) {
    super();
  }
}
