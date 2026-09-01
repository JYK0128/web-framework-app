import { Command } from '@nestjs/cqrs';

import type { ChangePasswordRequestDto } from '#/modules/auth/dto/change-password.request.dto';
import type { ChangePasswordResponseDto } from '#/modules/auth/dto/change-password.response.dto';

export class ChangePasswordCommand extends Command<ChangePasswordResponseDto> {
  constructor(public readonly input: ChangePasswordRequestDto) {
    super();
  }
}
