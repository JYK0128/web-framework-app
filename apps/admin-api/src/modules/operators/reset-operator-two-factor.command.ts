import { Command } from '@nestjs/cqrs';

import type { OperatorActionResponseDto } from '#/modules/operators';

export class ResetOperatorTwoFactorCommand extends Command<OperatorActionResponseDto> {
  constructor(public readonly input: { operatorId: string }) { super(); }
}
