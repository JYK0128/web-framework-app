import { Command } from '@nestjs/cqrs';

import type { UserDetailDto } from '#/modules/users/dto';

export interface RestoreUserPayload {
  id: string
}

export class RestoreUserCommand extends Command<UserDetailDto> {
  constructor(public readonly input: RestoreUserPayload) {
    super();
  }
}
