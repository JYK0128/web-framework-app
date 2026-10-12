import { Command } from '@nestjs/cqrs';

import type { UpdateTermGroupRequestDto, UpdateTermGroupResponseDto } from '#/modules/terms';

export class UpdateTermGroupCommand extends Command<UpdateTermGroupResponseDto> {
  constructor(public readonly input: { groupId: string, data: UpdateTermGroupRequestDto }) { super(); }
}
