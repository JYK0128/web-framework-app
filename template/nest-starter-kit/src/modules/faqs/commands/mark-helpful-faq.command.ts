import { Command } from '@nestjs/cqrs';

import type { FaqItemDto } from '#/modules/faqs/dto';

export interface MarkHelpfulFaqPayload {
  id: string
}

export class MarkHelpfulFaqCommand extends Command<FaqItemDto> {
  constructor(public readonly input: MarkHelpfulFaqPayload) {
    super();
  }
}
