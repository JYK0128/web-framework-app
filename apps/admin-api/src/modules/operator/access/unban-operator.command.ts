import { Command } from '@nestjs/cqrs';

import type { UnbanOperatorRequestDto } from '#/modules/operator/access/unban-operator.request.dto';
import type { UnbanOperatorResponseDto } from '#/modules/operator/access/unban-operator.response.dto';

export class UnbanOperatorCommand extends Command<UnbanOperatorResponseDto> {
  constructor(public readonly input: UnbanOperatorRequestDto) { super(); }
}
