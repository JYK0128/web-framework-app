import { Command } from '@nestjs/cqrs';

import type { RequestEmailVerificationRequestDto, RequestEmailVerificationResponseDto } from '#/modules/auth/dto';

export class RequestEmailVerificationCommand extends Command<RequestEmailVerificationResponseDto> {
  constructor(public readonly input: RequestEmailVerificationRequestDto) { super(); }
}
