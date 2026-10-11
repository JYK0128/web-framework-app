import { Command } from '@nestjs/cqrs';

import type { CreateOperatorRequestDto, CreateOperatorResponseDto } from '#/modules/operators/dto';

export class CreateOperatorCommand extends Command<CreateOperatorResponseDto> {
  constructor(public readonly input: CreateOperatorRequestDto) { super(); }
}
