import { Command } from '@nestjs/cqrs';

import { TwoFactorTurnOffRequestDto } from '#/modules/auth/dto/2fa-turn-off.request.dto';

export class TurnOff2FACommand extends Command<void> {
  constructor(public readonly input: TwoFactorTurnOffRequestDto) { super(); }
}
