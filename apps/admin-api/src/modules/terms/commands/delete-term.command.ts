import { Command } from '@nestjs/cqrs';

import type { DeleteTermResponseDto } from '#/modules/terms/dto';

export class DeleteTermCommand extends Command<DeleteTermResponseDto> {
  constructor(public readonly input: { termId: string }) {
    super();
  }
}
