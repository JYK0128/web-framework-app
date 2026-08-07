import { Command } from '@nestjs/cqrs';

import { TwoFactorCreateChallengeRequestDto } from '#/modules/auth/dto/2fa-create-challenge.request.dto';
import { TwoFactorCreateChallengeResponseDto } from '#/modules/auth/dto/2fa-create-challenge.response.dto';

export class Create2FAChallengeCommand extends Command<TwoFactorCreateChallengeResponseDto> {
  constructor(public readonly input: TwoFactorCreateChallengeRequestDto) { super(); }
}
