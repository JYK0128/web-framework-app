import { Command } from '@nestjs/cqrs';

import type { VerifyPhoneRequestDto } from '#/modules/onboarding/dto/verify-phone.request.dto';
import type { VerifyPhoneResponseDto } from '#/modules/onboarding/dto/verify-phone.response.dto';

export class VerifyPhoneCommand extends Command<VerifyPhoneResponseDto> {
  constructor(public readonly input: VerifyPhoneRequestDto) {
    super();
  }
}
