import { Command } from '@nestjs/cqrs';

import type { AdminTermDto } from '#/modules/terms/dto';

export interface PublishTermPayload {
  id: string
}

export class PublishTermCommand extends Command<AdminTermDto> {
  constructor(public readonly input: PublishTermPayload) {
    super();
  }
}
