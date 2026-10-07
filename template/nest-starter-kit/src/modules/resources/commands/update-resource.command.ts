import { Command } from '@nestjs/cqrs';

import { type UpdateResourceRequestDto, type UpdateResourceResponseDto } from '#/modules/resources/dto';

export interface UpdateResourcePayload {
  resourceId: string
  input: UpdateResourceRequestDto
}

export class UpdateResourceCommand extends Command<UpdateResourceResponseDto> {
  constructor(public readonly input: UpdateResourcePayload) {
    super();
  }
}
