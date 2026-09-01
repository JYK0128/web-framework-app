import { Command } from '@nestjs/cqrs';

import { TwoFactorGenerateRequestDto } from '#/modules/auth/dto/2fa-generate.request.dto';
import { TwoFactorGenerateResponseDto } from '#/modules/auth/dto/2fa-generate.response.dto';

export class Generate2FACommand extends Command<TwoFactorGenerateResponseDto> {
  constructor(public readonly input: TwoFactorGenerateRequestDto) { super(); }
}
