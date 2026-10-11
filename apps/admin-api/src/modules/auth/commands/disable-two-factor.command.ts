import { Command } from '@nestjs/cqrs';

import type { DisableTwoFactorResponseDto } from '#/modules/auth/dto/disable-two-factor.response.dto';
import type { EmptyProfileSecurityRequestDto } from '#/modules/auth/dto/empty-profile-security.request.dto';

export class DisableTwoFactorCommand extends Command<DisableTwoFactorResponseDto> {
  constructor(public readonly input: EmptyProfileSecurityRequestDto) { super(); }
}
