import { Command } from '@nestjs/cqrs';

import type { TwoFactorLoginRequestDto, TwoFactorLoginResponseDto } from '#/modules/auth/dto';

export class TwoFactorLoginCommand extends Command<TwoFactorLoginResponseDto> {
  constructor(public readonly input: TwoFactorLoginRequestDto) {
    super();
  }
}
