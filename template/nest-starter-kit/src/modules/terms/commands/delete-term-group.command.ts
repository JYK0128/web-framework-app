import { Command } from '@nestjs/cqrs';

import type { DeleteTermGroupResponseDto } from '#/modules/terms/dto';

export interface DeleteTermGroupPayload {
  id: string
  currentUserId: string
}

export class DeleteTermGroupCommand extends Command<DeleteTermGroupResponseDto> {
  constructor(public readonly input: DeleteTermGroupPayload) {
    super();
  }
}
