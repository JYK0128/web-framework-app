import { Command } from '@nestjs/cqrs';

import type { RoleName } from '#/entities/auth.extentions/role.entity';
import type { UserDetailDto } from '#/modules/users/dto';

export class UpdateUserRoleCommand extends Command<UserDetailDto> {
  constructor(
    public readonly id: string,
    public readonly role: RoleName,
    public readonly currentUserId: string,
  ) {
    super();
  }
}
