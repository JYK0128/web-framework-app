import { Command } from '@nestjs/cqrs';

import type { OperatorActionResponseDto } from '#/modules/operators';

export class UnbanOperatorCommand extends Command<OperatorActionResponseDto> {
  constructor(public readonly input: { operatorId: string }) { super(); }
}
