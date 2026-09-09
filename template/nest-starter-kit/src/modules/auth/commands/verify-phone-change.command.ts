import { Command } from '@nestjs/cqrs';

import type { VerifyPhoneChangeRequestDto } from '#/modules/auth/dto/verify-phone-change.request.dto';
import type { VerifyPhoneChangeResponseDto } from '#/modules/auth/dto/verify-phone-change.response.dto';

export class VerifyPhoneChangeCommand extends Command<VerifyPhoneChangeResponseDto> {
  constructor(public readonly input: VerifyPhoneChangeRequestDto) {
    super();
  }
}
