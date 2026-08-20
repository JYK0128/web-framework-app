import { Command } from '@nestjs/cqrs';

import type { UserActionResponseDto } from '#/modules/users/dto';

export interface ResetUserTwoFactorPayload {
  id: string
}

export class ResetUserTwoFactorCommand extends Command<UserActionResponseDto> {
  constructor(public readonly input: ResetUserTwoFactorPayload) {
    super();
  }
}
