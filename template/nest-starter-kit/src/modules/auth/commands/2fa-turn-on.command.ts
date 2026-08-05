import { Command } from '@nestjs/cqrs';

import { TurnOn2FARequestDto } from '#/modules/auth/dto/2fa-turn-on.request.dto';

export class TurnOn2FACommand extends Command<void> {
  constructor(public readonly input: TurnOn2FARequestDto) { super(); }
}
