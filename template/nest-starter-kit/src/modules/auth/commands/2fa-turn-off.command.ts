import { Command } from '@nestjs/cqrs';

import { TurnOff2FARequestDto, TurnOff2FAResponseDto } from '#/modules/auth/dto';

export class TurnOff2FACommand extends Command<TurnOff2FAResponseDto> {
  constructor(public readonly input: TurnOff2FARequestDto) { super(); }
}
