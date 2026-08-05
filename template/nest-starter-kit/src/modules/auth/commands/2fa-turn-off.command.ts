import { Command } from '@nestjs/cqrs';

import { TurnOff2FARequestDto } from '#/modules/auth/dto/2fa-turn-off.request.dto';

export class TurnOff2FACommand extends Command<void> {
  constructor(public readonly input: TurnOff2FARequestDto) { super(); }
}
