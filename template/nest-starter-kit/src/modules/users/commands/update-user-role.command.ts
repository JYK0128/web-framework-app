import { Command } from '@nestjs/cqrs';

import type { UpdateUserRoleRequestDto, UpdateUserRoleResponseDto } from '#/modules/users/dto';

export interface UpdateUserRolePayload {
  userId: string
  input: UpdateUserRoleRequestDto
}

export class UpdateUserRoleCommand extends Command<UpdateUserRoleResponseDto> {
  constructor(public readonly input: UpdateUserRolePayload) {
    super();
  }
}
