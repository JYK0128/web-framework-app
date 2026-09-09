import { Command } from '@nestjs/cqrs';

import type { VerifyIdentityPhoneChangeRequestDto } from '#/modules/auth/dto/verify-identity-phone-change.request.dto';
import type { VerifyIdentityPhoneChangeResponseDto } from '#/modules/auth/dto/verify-identity-phone-change.response.dto';

export class VerifyIdentityPhoneChangeCommand extends Command<VerifyIdentityPhoneChangeResponseDto> {
  constructor(public readonly input: VerifyIdentityPhoneChangeRequestDto) {
    super();
  }
}
