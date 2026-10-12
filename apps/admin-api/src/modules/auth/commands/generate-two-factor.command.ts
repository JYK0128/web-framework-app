import { Command } from '@nestjs/cqrs';

import type { GenerateTwoFactorRequestDto } from '#/modules/auth/dto/generate-two-factor.request.dto';
import type { GenerateTwoFactorResponseDto } from '#/modules/auth/dto/generate-two-factor.response.dto';

export class GenerateTwoFactorCommand extends Command<GenerateTwoFactorResponseDto> {
  constructor(public readonly input: GenerateTwoFactorRequestDto) { super(); }
}
