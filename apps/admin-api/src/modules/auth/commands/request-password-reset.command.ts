import { Command } from '@nestjs/cqrs';

import type { PasswordResetRequestDto } from '#/modules/auth/dto/password-reset.request.dto';
import type { PasswordResetRequestResponseDto } from '#/modules/auth/dto/password-reset-request.response.dto';

export class RequestPasswordResetCommand extends Command<PasswordResetRequestResponseDto> {
  constructor(public readonly input: PasswordResetRequestDto) { super(); }
}
