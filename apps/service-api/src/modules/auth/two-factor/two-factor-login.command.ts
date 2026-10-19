import { Command } from '@nestjs/cqrs';

import type { TwoFactorLoginRequestDto } from '#/modules/auth/two-factor/two-factor-login.request.dto';
import type { TwoFactorLoginResponseDto } from '#/modules/auth/two-factor/two-factor-login.response.dto';

export class TwoFactorLoginCommand extends Command<TwoFactorLoginResponseDto> {
  constructor(public readonly input: TwoFactorLoginRequestDto) {
    super();
  }
}
