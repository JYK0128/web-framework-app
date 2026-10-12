import { Command } from '@nestjs/cqrs';

import type { EnableTwoFactorRequestDto, EnableTwoFactorResponseDto } from '#/modules/auth/dto';

export class EnableTwoFactorCommand extends Command<EnableTwoFactorResponseDto> {
  constructor(public readonly input: EnableTwoFactorRequestDto) { super(); }
}
