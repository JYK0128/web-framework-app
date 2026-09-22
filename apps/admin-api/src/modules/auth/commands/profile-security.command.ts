import { Command } from '@nestjs/cqrs';

import type { ChangePasswordRequestDto, ChangePasswordResponseDto, DisableTwoFactorResponseDto, EmptyProfileSecurityRequestDto, EnableTwoFactorRequestDto, EnableTwoFactorResponseDto, GenerateTwoFactorResponseDto, UnregisterResponseDto } from '#/modules/auth/interfaces/profile-security.dto';

export class ChangePasswordCommand extends Command<ChangePasswordResponseDto> {
  constructor(public readonly input: ChangePasswordRequestDto) { super(); }
}

export class GenerateTwoFactorCommand extends Command<GenerateTwoFactorResponseDto> {
  constructor(public readonly input: EmptyProfileSecurityRequestDto) { super(); }
}

export class EnableTwoFactorCommand extends Command<EnableTwoFactorResponseDto> {
  constructor(public readonly input: EnableTwoFactorRequestDto) { super(); }
}

export class DisableTwoFactorCommand extends Command<DisableTwoFactorResponseDto> {
  constructor(public readonly input: EmptyProfileSecurityRequestDto) { super(); }
}

export class UnregisterCommand extends Command<UnregisterResponseDto> {
  constructor(public readonly input: EmptyProfileSecurityRequestDto) { super(); }
}
