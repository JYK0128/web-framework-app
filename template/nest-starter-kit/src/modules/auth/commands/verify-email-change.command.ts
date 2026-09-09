import { Command } from '@nestjs/cqrs';

import type { VerifyEmailChangeRequestDto } from '#/modules/auth/dto/verify-email-change.request.dto';
import type { VerifyEmailChangeResponseDto } from '#/modules/auth/dto/verify-email-change.response.dto';

export class VerifyEmailChangeCommand extends Command<VerifyEmailChangeResponseDto> {
  constructor(public readonly input: VerifyEmailChangeRequestDto) {
    super();
  }
}
