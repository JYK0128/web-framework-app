import { Command } from '@nestjs/cqrs';

import type { OperatorActionResponseDto, UpdateOperatorRoleRequestDto } from '#/modules/operators/dto';

export class UpdateOperatorRoleCommand extends Command<OperatorActionResponseDto> {
  constructor(public readonly input: { operatorId: string, data: UpdateOperatorRoleRequestDto }) { super(); }
}
