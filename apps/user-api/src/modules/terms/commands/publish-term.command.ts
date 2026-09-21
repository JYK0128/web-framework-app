import { Command } from '@nestjs/cqrs';

import type { PublishTermResponseDto } from '#/modules/terms/interfaces';

export class PublishTermCommand extends Command<PublishTermResponseDto> {
  constructor(public readonly input: { termId: string }) {
    super();
  }
}
