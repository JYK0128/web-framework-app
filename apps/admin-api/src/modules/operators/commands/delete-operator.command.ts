import { Command } from '@nestjs/cqrs';

import type { OperatorActionResponseDto } from '#/modules/operators/dto';

export class DeleteOperatorCommand extends Command<OperatorActionResponseDto> {
  constructor(public readonly input: { operatorId: string }) { super(); }
}
