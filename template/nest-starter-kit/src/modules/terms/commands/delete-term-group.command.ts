import { Command } from '@nestjs/cqrs';

import type { TermGroupItemDto } from '#/modules/terms/dto';

export class DeleteTermGroupCommand extends Command<TermGroupItemDto> {
  constructor(
    public readonly id: string,
    public readonly currentUserId: string,
  ) {
    super();
  }
}
