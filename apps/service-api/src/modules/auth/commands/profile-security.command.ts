import { Command } from '@nestjs/cqrs';

import type { ChangePasswordRequestDto, ChangePasswordResponseDto, EmptyProfileSecurityRequestDto, GenerateTwoFactorResponseDto, TwoFactorCodeRequestDto, TwoFactorStateResponseDto, UnregisterResponseDto } from '#/modules/auth/dto/profile-security.dto';

export class ChangePasswordCommand extends Command<ChangePasswordResponseDto> {
  constructor(public readonly input: ChangePasswordRequestDto) { super(); }
}

export class GenerateTwoFactorCommand extends Command<GenerateTwoFactorResponseDto> {
  constructor(public readonly input: EmptyProfileSecurityRequestDto) { super(); }
}

export class EnableTwoFactorCommand extends Command<TwoFactorStateResponseDto> {
  constructor(public readonly input: TwoFactorCodeRequestDto) { super(); }
}

export class DisableTwoFactorCommand extends Command<TwoFactorStateResponseDto> {
  constructor(public readonly input: EmptyProfileSecurityRequestDto) { super(); }
}

export class UnregisterCommand extends Command<UnregisterResponseDto> {
  constructor(public readonly input: EmptyProfileSecurityRequestDto) { super(); }
}
