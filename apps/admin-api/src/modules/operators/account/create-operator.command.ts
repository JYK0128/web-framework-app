import { Command } from '@nestjs/cqrs';

import type { CreateOperatorRequestDto } from '#/modules/operators/account/create-operator.request.dto';
import type { CreateOperatorResponseDto } from '#/modules/operators/account/create-operator.response.dto';

export class CreateOperatorCommand extends Command<CreateOperatorResponseDto> {
  constructor(public readonly input: CreateOperatorRequestDto) { super(); }
}
