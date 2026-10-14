import { Command } from '@nestjs/cqrs';

import type { DeleteOperatorRequestDto } from '#/modules/operators/account/delete-operator.request.dto';
import type { DeleteOperatorResponseDto } from '#/modules/operators/account/delete-operator.response.dto';

export class DeleteOperatorCommand extends Command<DeleteOperatorResponseDto> {
  constructor(public readonly input: DeleteOperatorRequestDto) { super(); }
}
