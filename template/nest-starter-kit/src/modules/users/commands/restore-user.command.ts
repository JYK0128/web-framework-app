import { Command } from '@nestjs/cqrs';

import type { UserDetailDto } from '#/modules/users/dto';

export class RestoreUserCommand extends Command<UserDetailDto> {
  constructor(public readonly id: string) {
    super();
  }
}
