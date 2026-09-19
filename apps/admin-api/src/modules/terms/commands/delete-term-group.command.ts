import { Command } from '@nestjs/cqrs';

import type { DeleteTermGroupResponseDto } from '#/modules/terms/interfaces';

export class DeleteTermGroupCommand extends Command<DeleteTermGroupResponseDto> {
  constructor(public readonly input: { groupId: string }) { super(); }
}
