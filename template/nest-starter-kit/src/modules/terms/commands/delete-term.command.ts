import { Command } from '@nestjs/cqrs';

import type { DeleteTermResponseDto } from '#/modules/terms/dto';

export interface DeleteTermPayload {
  id: string
  currentUserId: string
}

export class DeleteTermCommand extends Command<DeleteTermResponseDto> {
  constructor(public readonly input: DeleteTermPayload) {
    super();
  }
}
