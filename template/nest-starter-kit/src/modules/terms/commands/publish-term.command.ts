import { Command } from '@nestjs/cqrs';

import type { AdminTermDto } from '#/modules/terms/dto';

export class PublishTermCommand extends Command<AdminTermDto> {
  constructor(public readonly id: string) {
    super();
  }
}
