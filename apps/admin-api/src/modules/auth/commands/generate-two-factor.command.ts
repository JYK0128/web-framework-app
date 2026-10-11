import { Command } from '@nestjs/cqrs';

import type { EmptyProfileSecurityRequestDto } from '#/modules/auth/dto/empty-profile-security.request.dto';
import type { GenerateTwoFactorResponseDto } from '#/modules/auth/dto/generate-two-factor.response.dto';

export class GenerateTwoFactorCommand extends Command<GenerateTwoFactorResponseDto> {
  constructor(public readonly input: EmptyProfileSecurityRequestDto) { super(); }
}
