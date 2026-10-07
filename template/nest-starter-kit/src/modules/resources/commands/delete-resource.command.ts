import { Command } from '@nestjs/cqrs';

import type { DeleteResourceResponseDto } from '#/modules/resources/dto';

export interface DeleteResourcePayload {
  resourceId: string
}

export class DeleteResourceCommand extends Command<DeleteResourceResponseDto> {
  constructor(public readonly input: DeleteResourcePayload) {
    super();
  }
}
