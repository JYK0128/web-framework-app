import { Command } from '@nestjs/cqrs';

import type { UserActionResponseDto } from '#/modules/users/dto';

export class ResetUserTwoFactorCommand extends Command<UserActionResponseDto> {
  constructor(public readonly id: string) {
    super();
  }
}
