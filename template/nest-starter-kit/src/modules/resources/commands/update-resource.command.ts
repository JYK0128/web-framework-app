import { Command } from '@nestjs/cqrs';

import { type UpdateResourceRequestDto, type UpdateResourceResponseDto } from '#/modules/resources/dto/update-resource.dto';

export class UpdateResourceCommand extends Command<UpdateResourceResponseDto> {
  constructor(public readonly input: { id: string, input: UpdateResourceRequestDto }) {
    super();
  }
}
