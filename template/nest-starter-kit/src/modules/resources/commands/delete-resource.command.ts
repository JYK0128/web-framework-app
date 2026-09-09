import { Command } from '@nestjs/cqrs';

import type { DeleteResourceResponseDto } from '#/modules/resources/dto';

export class DeleteResourceCommand extends Command<DeleteResourceResponseDto> {
  constructor(public readonly input: { id: string }) {
    super();
  }
}
