import { Command } from '@nestjs/cqrs';

import { TurnOn2FARequestDto, TurnOn2FAResponseDto } from '#/modules/auth/dto';

export class TurnOn2FACommand extends Command<TurnOn2FAResponseDto> {
  constructor(public readonly input: TurnOn2FARequestDto) { super(); }
}
