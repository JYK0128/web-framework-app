import { Command } from '@nestjs/cqrs';

import { TwoFactorVerifyChallengeInputDto } from '#/modules/auth/dto/2fa-verify-challenge.input.dto';
import { TwoFactorVerifyChallengeOutputDto } from '#/modules/auth/dto/2fa-verify-challenge.output.dto';

export class Verify2FAChallengeCommand extends Command<TwoFactorVerifyChallengeOutputDto> {
  constructor(public readonly input: TwoFactorVerifyChallengeInputDto) { super(); }
}
