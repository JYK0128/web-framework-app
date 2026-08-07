import { Command } from '@nestjs/cqrs';

import { TwoFactorTurnOnRequestDto } from '#/modules/auth/dto/2fa-turn-on.request.dto';

export class TurnOn2FACommand extends Command<void> {
  constructor(public readonly input: TwoFactorTurnOnRequestDto) { super(); }
}
