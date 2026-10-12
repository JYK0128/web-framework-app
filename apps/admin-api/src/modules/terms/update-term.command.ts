import { Command } from '@nestjs/cqrs';

import type { UpdateTermRequestDto, UpdateTermResponseDto } from '#/modules/terms';

export class UpdateTermCommand extends Command<UpdateTermResponseDto> {
  constructor(public readonly input: { termId: string, data: UpdateTermRequestDto }) {
    super();
  }
}
