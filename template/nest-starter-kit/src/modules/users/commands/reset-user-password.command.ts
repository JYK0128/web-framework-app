import { Command } from '@nestjs/cqrs';

import type { ResetPasswordResponseDto } from '#/modules/users/dto';

export class ResetUserPasswordCommand extends Command<ResetPasswordResponseDto> {
  constructor(public readonly id: string) {
    super();
  }
}
