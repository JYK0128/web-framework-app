import { Command } from '@nestjs/cqrs';

import type { PasswordResetAcceptedDto, PasswordResetResponseDto, RequestPasswordResetDto, ResetPasswordDto } from '#/modules/auth/dto/registration.dto';

export class RequestPasswordResetCommand extends Command<PasswordResetAcceptedDto> {
  constructor(public readonly input: RequestPasswordResetDto) { super(); }
}

export class ResetPasswordCommand extends Command<PasswordResetResponseDto> {
  constructor(public readonly input: ResetPasswordDto) { super(); }
}
