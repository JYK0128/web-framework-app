import { Command } from '@nestjs/cqrs';

import type { VerifyPhoneNumberRequestDto, VerifyPhoneNumberResponseDto } from '#/modules/auth/dto/verify-phone-number.dto';

export class VerifyPhoneNumberCommand extends Command<VerifyPhoneNumberResponseDto> {
  constructor(public readonly input: VerifyPhoneNumberRequestDto) { super(); }
}
