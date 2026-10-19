import { Command } from '@nestjs/cqrs';

import type { UpdateTermGroupRequestDto } from '#/modules/term/group/update-term-group.request.dto';
import type { UpdateTermGroupResponseDto } from '#/modules/term/group/update-term-group.response.dto';

export class UpdateTermGroupCommand extends Command<UpdateTermGroupResponseDto> {
  constructor(public readonly input: { groupId: string, data: UpdateTermGroupRequestDto }) { super(); }
}
