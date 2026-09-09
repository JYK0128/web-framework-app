import { Query } from '@nestjs/cqrs';

import type { VerifyPasswordResetTokenRequestDto } from '#/modules/auth/dto/verify-password-reset-token.request.dto';
import type { VerifyPasswordResetTokenResponseDto } from '#/modules/auth/dto/verify-password-reset-token.response.dto';

export class VerifyPasswordResetTokenQuery extends Query<VerifyPasswordResetTokenResponseDto> {
  constructor(public readonly input: VerifyPasswordResetTokenRequestDto) {
    super();
  }
}
