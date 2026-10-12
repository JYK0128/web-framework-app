import { Command } from '@nestjs/cqrs';

import type { GenerateTwoFactorRequestDto, GenerateTwoFactorResponseDto } from '#/modules/auth/dto';

export class GenerateTwoFactorCommand extends Command<GenerateTwoFactorResponseDto> {
  constructor(public readonly input: GenerateTwoFactorRequestDto) { super(); }
}
