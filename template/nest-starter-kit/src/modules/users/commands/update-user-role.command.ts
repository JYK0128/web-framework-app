import { Command } from '@nestjs/cqrs';

import type { RoleName } from '#/entities/auth.extentions/role.entity';
import type { UpdateUserRoleResponseDto } from '#/modules/users/dto';

export interface UpdateUserRolePayload {
  id: string
  role: RoleName
  currentUserId: string
}

export class UpdateUserRoleCommand extends Command<UpdateUserRoleResponseDto> {
  constructor(public readonly input: UpdateUserRolePayload) {
    super();
  }
}
