import { Command } from '@nestjs/cqrs';

import type { VerifyPhoneNumberRequestDto } from '#/modules/auth/phone-verification/verify-phone-number.request.dto';
import type { VerifyPhoneNumberResponseDto } from '#/modules/auth/phone-verification/verify-phone-number.response.dto';

export class VerifyPhoneNumberCommand extends Command<VerifyPhoneNumberResponseDto> {
  constructor(public readonly input: VerifyPhoneNumberRequestDto) { super(); }
}
