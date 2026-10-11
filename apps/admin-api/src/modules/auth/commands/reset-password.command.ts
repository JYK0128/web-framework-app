import { Command } from '@nestjs/cqrs';

import type { PasswordResetResponseDto } from '#/modules/auth/dto/password-reset.response.dto';
import type { ResetPasswordRequestDto } from '#/modules/auth/dto/reset-password.request.dto';

export class ResetPasswordCommand extends Command<PasswordResetResponseDto> {
  constructor(public readonly input: ResetPasswordRequestDto) { super(); }
}
