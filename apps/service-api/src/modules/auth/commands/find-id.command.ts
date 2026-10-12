import { Command } from '@nestjs/cqrs';

import type { FindIdRequestDto, FindIdResponseDto } from '#/modules/auth/dto';

export class FindIdCommand extends Command<FindIdResponseDto> {
  constructor(public readonly input: FindIdRequestDto) { super(); }
}
