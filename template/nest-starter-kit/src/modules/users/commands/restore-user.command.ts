import { Command } from '@nestjs/cqrs';

import type { RestoreUserResponseDto } from '#/modules/users/dto';

export interface RestoreUserPayload {
  userId: string
}

export class RestoreUserCommand extends Command<RestoreUserResponseDto> {
  constructor(public readonly input: RestoreUserPayload) {
    super();
  }
}
