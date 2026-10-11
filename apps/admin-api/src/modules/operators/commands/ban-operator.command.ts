import { Command } from '@nestjs/cqrs';

import type { BanOperatorRequestDto, OperatorActionResponseDto } from '#/modules/operators/dto';

export class BanOperatorCommand extends Command<OperatorActionResponseDto> {
  constructor(public readonly input: { operatorId: string, data: BanOperatorRequestDto }) { super(); }
}
