import { Command } from '@nestjs/cqrs';

import type { DeleteRoleResponseDto } from '#/modules/roles/dto';

export interface DeleteRolePayload {
  roleId: string
}

export class DeleteRoleCommand extends Command<DeleteRoleResponseDto> {
  constructor(public readonly input: DeleteRolePayload) {
    super();
  }
}
