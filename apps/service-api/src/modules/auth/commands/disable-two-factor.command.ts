import { Command } from '@nestjs/cqrs';

import type { DisableTwoFactorRequestDto, DisableTwoFactorResponseDto } from '#/modules/auth/dto';

export class DisableTwoFactorCommand extends Command<DisableTwoFactorResponseDto> {
  constructor(public readonly input: DisableTwoFactorRequestDto) { super(); }
}
