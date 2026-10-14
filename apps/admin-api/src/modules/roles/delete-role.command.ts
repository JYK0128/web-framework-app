import { Command } from '@nestjs/cqrs';

import type { DeleteRoleRequestDto } from '#/modules/roles/delete-role.request.dto';
import type { DeleteRoleResponseDto } from '#/modules/roles/delete-role.response.dto';

export class DeleteRoleCommand extends Command<DeleteRoleResponseDto> {
  constructor(public readonly input: DeleteRoleRequestDto) { super(); }
}
