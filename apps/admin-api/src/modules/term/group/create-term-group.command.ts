import { Command } from '@nestjs/cqrs';

import type { CreateTermGroupRequestDto } from '~/modules/term/group/create-term-group.request.dto';
import type { CreateTermGroupResponseDto } from '~/modules/term/group/create-term-group.response.dto';

export class CreateTermGroupCommand extends Command<CreateTermGroupResponseDto> {
  constructor(public readonly input: CreateTermGroupRequestDto) { super(); }
}
