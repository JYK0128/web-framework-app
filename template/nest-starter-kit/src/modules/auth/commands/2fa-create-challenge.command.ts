import { Command } from '@nestjs/cqrs';

import type { TwoFactorCreateChallengeRequestDto, TwoFactorCreateChallengeResponseDto } from '#/modules/auth/dto';

export class TwoFactorCreateChallengeCommand extends Command<TwoFactorCreateChallengeResponseDto> {
  constructor(public readonly input: TwoFactorCreateChallengeRequestDto) {
    super();
  }
}
