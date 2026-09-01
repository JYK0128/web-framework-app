import { Command } from '@nestjs/cqrs';

import type { ResetUserTwoFactorResponseDto } from '#/modules/users/dto';

export interface ResetUserTwoFactorPayload {
  id: string
}

export class ResetUserTwoFactorCommand extends Command<ResetUserTwoFactorResponseDto> {
  constructor(public readonly input: ResetUserTwoFactorPayload) {
    super();
  }
}
