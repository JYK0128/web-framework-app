import { Command } from '@nestjs/cqrs';

import type { ResetUserPasswordResponseDto } from '#/modules/users/dto';

export interface ResetUserPasswordPayload {
  userId: string
}

export class ResetUserPasswordCommand extends Command<ResetUserPasswordResponseDto> {
  constructor(public readonly input: ResetUserPasswordPayload) {
    super();
  }
}
