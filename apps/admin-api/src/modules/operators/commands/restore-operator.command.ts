import { Command } from '@nestjs/cqrs';

import type { OperatorActionResponseDto } from '#/modules/operators/dto';

export class RestoreOperatorCommand extends Command<OperatorActionResponseDto> {
  constructor(public readonly input: { operatorId: string }) { super(); }
}
