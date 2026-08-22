import { Command } from '@nestjs/cqrs';

import type { UnbanUserResponseDto } from '#/modules/users/dto';

export interface UnbanUserPayload {
  id: string
  currentUserId: string
}

export class UnbanUserCommand extends Command<UnbanUserResponseDto> {
  constructor(public readonly input: UnbanUserPayload) {
    super();
  }
}
