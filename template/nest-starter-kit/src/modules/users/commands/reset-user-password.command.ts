import { Command } from '@nestjs/cqrs';

import type { ResetPasswordResponseDto } from '#/modules/users/dto';

export interface ResetUserPasswordPayload {
  id: string
}

export class ResetUserPasswordCommand extends Command<ResetPasswordResponseDto> {
  constructor(public readonly input: ResetUserPasswordPayload) {
    super();
  }
}
