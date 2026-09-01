import { Command } from '@nestjs/cqrs';

import type { TwoFactorVerifyChallengeRequestDto } from '#/modules/auth/dto/2fa-verify-challenge.request.dto';
import type { TwoFactorVerifyChallengeResponseDto } from '#/modules/auth/dto/2fa-verify-challenge.response.dto';

export class Verify2FAChallengeCommand extends Command<TwoFactorVerifyChallengeResponseDto> {
  constructor(public readonly input: TwoFactorVerifyChallengeRequestDto) {
    super();
  }
}
