import { Command } from '@nestjs/cqrs';

import type { GenerateTwoFactorRequestDto } from '#/modules/auth/two-factor/generate-two-factor.request.dto';
import type { GenerateTwoFactorResponseDto } from '#/modules/auth/two-factor/generate-two-factor.response.dto';

export class GenerateTwoFactorCommand extends Command<GenerateTwoFactorResponseDto> {
  constructor(public readonly input: GenerateTwoFactorRequestDto) { super(); }
}
