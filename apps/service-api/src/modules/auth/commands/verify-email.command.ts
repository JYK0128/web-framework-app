import { Command } from '@nestjs/cqrs';

import type { VerifyEmailRequestDto, VerifyEmailResponseDto } from '#/modules/auth/dto';

export class VerifyEmailCommand extends Command<VerifyEmailResponseDto> {
  constructor(public readonly input: VerifyEmailRequestDto) { super(); }
}
