import { Command } from '@nestjs/cqrs';

import type { AdminTermDto } from '#/modules/terms/dto';

export class DeleteTermCommand extends Command<AdminTermDto> {
  constructor(
    public readonly id: string,
    public readonly currentUserId: string,
  ) {
    super();
  }
}
