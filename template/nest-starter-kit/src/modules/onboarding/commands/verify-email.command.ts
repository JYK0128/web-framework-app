import { Command } from '@nestjs/cqrs';

import type { VerifyEmailRequestDto } from '#/modules/onboarding/dto/verify-email.request.dto';
import type { VerifyEmailResponseDto } from '#/modules/onboarding/dto/verify-email.response.dto';

export class VerifyEmailCommand extends Command<VerifyEmailResponseDto> {
  constructor(public readonly input: VerifyEmailRequestDto) {
    super();
  }
}
