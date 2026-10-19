import { Command } from '@nestjs/cqrs';

import type { DeleteTermGroupRequestDto } from '#/modules/term/group/delete-term-group.request.dto';
import type { DeleteTermGroupResponseDto } from '#/modules/term/group/delete-term-group.response.dto';

export class DeleteTermGroupCommand extends Command<DeleteTermGroupResponseDto> {
  constructor(public readonly input: DeleteTermGroupRequestDto) { super(); }
}
