import { Command } from '@nestjs/cqrs';

import type { ResetPasswordRequestDto } from '#/modules/auth/dto/reset-password.request.dto';
import type { ResetPasswordResponseDto } from '#/modules/auth/dto/reset-password.response.dto';

export class ResetPasswordCommand extends Command<ResetPasswordResponseDto> {
  constructor(public readonly input: ResetPasswordRequestDto) {
    super();
  }
}
