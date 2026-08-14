import { Command } from '@nestjs/cqrs';

import { TwoFactorCreateChallengeInputDto } from '#/modules/auth/dto/2fa-create-challenge.input.dto';
import { TwoFactorCreateChallengeOutputDto } from '#/modules/auth/dto/2fa-create-challenge.output.dto';

export class Create2FAChallengeCommand extends Command<TwoFactorCreateChallengeOutputDto> {
  constructor(public readonly input: TwoFactorCreateChallengeInputDto) { super(); }
}
