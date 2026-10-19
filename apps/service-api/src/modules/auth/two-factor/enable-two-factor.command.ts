import { Command } from '@nestjs/cqrs';

import type { EnableTwoFactorRequestDto } from '#/modules/auth/two-factor/enable-two-factor.request.dto';
import type { EnableTwoFactorResponseDto } from '#/modules/auth/two-factor/enable-two-factor.response.dto';

export class EnableTwoFactorCommand extends Command<EnableTwoFactorResponseDto> {
  constructor(public readonly input: EnableTwoFactorRequestDto) {
    super();
  }
}
