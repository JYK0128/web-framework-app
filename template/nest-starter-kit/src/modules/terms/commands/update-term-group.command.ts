import { Command } from '@nestjs/cqrs';

import type { UpdateTermGroupRequestDto, UpdateTermGroupResponseDto } from '#/modules/terms/dto';

export interface UpdateTermGroupPayload {
  id: string
  input: UpdateTermGroupRequestDto
}

export class UpdateTermGroupCommand extends Command<UpdateTermGroupResponseDto> {
  constructor(public readonly input: UpdateTermGroupPayload) {
    super();
  }
}
