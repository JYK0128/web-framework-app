import { Command } from '@nestjs/cqrs';

import type { UpdateTermRequestDto, UpdateTermResponseDto } from '#/modules/terms/dto';

export interface UpdateTermPayload {
  id: string
  input: UpdateTermRequestDto
}

export class UpdateTermCommand extends Command<UpdateTermResponseDto> {
  constructor(public readonly input: UpdateTermPayload) {
    super();
  }
}
