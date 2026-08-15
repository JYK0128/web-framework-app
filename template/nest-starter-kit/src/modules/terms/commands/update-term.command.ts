import { Command } from '@nestjs/cqrs';

import type { AdminTermDto, UpdateTermRequestDto } from '#/modules/terms/dto';

export class UpdateTermCommand extends Command<AdminTermDto> {
  constructor(
    public readonly id: string,
    public readonly input: UpdateTermRequestDto,
  ) {
    super();
  }
}
