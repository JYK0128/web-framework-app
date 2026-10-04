import { Command } from '@nestjs/cqrs';

import type { DeleteTermResponseDto } from '#/modules/terms/interfaces';

export class DeleteTermCommand extends Command<DeleteTermResponseDto> {
  constructor(public readonly input: { termId: string }) {
    super();
  }
}
