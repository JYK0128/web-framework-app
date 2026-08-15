import { Command } from '@nestjs/cqrs';

import type { TermGroupItemDto, UpdateTermGroupRequestDto } from '#/modules/terms/dto';

export class UpdateTermGroupCommand extends Command<TermGroupItemDto> {
  constructor(
    public readonly id: string,
    public readonly input: UpdateTermGroupRequestDto,
  ) {
    super();
  }
}
