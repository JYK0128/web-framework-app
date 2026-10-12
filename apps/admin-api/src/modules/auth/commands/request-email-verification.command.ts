import { Command } from '@nestjs/cqrs';

import type { RequestEmailVerificationRequestDto } from '#/modules/auth/dto/request-email-verification.request.dto';
import type { RequestEmailVerificationResponseDto } from '#/modules/auth/dto/request-email-verification.response.dto';

export class RequestEmailVerificationCommand extends Command<RequestEmailVerificationResponseDto> {
  constructor(public readonly input: RequestEmailVerificationRequestDto) { super(); }
}
