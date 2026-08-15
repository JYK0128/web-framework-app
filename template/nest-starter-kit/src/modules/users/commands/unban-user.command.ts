import { Command } from '@nestjs/cqrs';

import type { UserDetailDto } from '#/modules/users/dto';

export class UnbanUserCommand extends Command<UserDetailDto> {
  constructor(
    public readonly id: string,
    public readonly currentUserId: string,
  ) {
    super();
  }
}
