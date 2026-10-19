import { Command } from '@nestjs/cqrs';

import type { PublishTermResponseDto } from '#/modules/terms/dto';

export interface PublishTermPayload {
  termId: string
}

export class PublishTermCommand extends Command<PublishTermResponseDto> {
  constructor(public readonly input: PublishTermPayload) {
    super();
  }
}
