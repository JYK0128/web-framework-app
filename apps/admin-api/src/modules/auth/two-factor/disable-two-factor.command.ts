import { Command } from '@nestjs/cqrs';

import type { DisableTwoFactorRequestDto } from '~/modules/auth/two-factor/disable-two-factor.request.dto';
import type { DisableTwoFactorResponseDto } from '~/modules/auth/two-factor/disable-two-factor.response.dto';

export class DisableTwoFactorCommand extends Command<DisableTwoFactorResponseDto> {
  constructor(public readonly input: DisableTwoFactorRequestDto) { super(); }
}
