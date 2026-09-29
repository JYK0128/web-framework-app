import { Command } from '@nestjs/cqrs';

import type { GenerateTwoFactorResponseDto, TwoFactorCodeRequestDto, TwoFactorStateResponseDto } from '#/modules/auth/dto/profile-security.dto';

export class GenerateTwoFactorCommand extends Command<GenerateTwoFactorResponseDto> {}

export class EnableTwoFactorCommand extends Command<TwoFactorStateResponseDto> {
  constructor(public readonly input: TwoFactorCodeRequestDto) { super(); }
}

export class DisableTwoFactorCommand extends Command<TwoFactorStateResponseDto> {}
