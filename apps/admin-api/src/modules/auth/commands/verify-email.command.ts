import { Command } from '@nestjs/cqrs';

import type { VerifyEmailRequestDto } from '#/modules/auth/dto/verify-email.request.dto';
import type { VerifyEmailResponseDto } from '#/modules/auth/dto/verify-email.response.dto';

export class VerifyEmailCommand extends Command<VerifyEmailResponseDto> {
  constructor(public readonly input: VerifyEmailRequestDto) { super(); }
}
