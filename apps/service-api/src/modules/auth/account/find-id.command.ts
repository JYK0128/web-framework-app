import { Command } from '@nestjs/cqrs';

import type { FindIdRequestDto } from '#/modules/auth/account/find-id.request.dto';
import type { FindIdResponseDto } from '#/modules/auth/account/find-id.response.dto';

export class FindIdCommand extends Command<FindIdResponseDto> {
  constructor(public readonly input: FindIdRequestDto) { super(); }
}
