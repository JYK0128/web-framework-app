import { Command } from '@nestjs/cqrs';

import type { FindIdRequestDto, FindIdResponseDto } from '#/modules/auth/dto/account-recovery.dto';

export class FindIdCommand extends Command<FindIdResponseDto> {
  constructor(public readonly input: FindIdRequestDto) { super(); }
}
