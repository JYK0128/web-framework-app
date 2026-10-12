import { Command } from '@nestjs/cqrs';

import type { ResetPasswordRequestDto, ResetPasswordResponseDto } from '#/modules/auth/dto';

export class ResetPasswordCommand extends Command<ResetPasswordResponseDto> {
  constructor(public readonly input: ResetPasswordRequestDto) { super(); }
}
