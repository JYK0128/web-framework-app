import { Command } from '@nestjs/cqrs';

import type { DeleteRoleRequestDto } from '~/modules/role/delete-role.request.dto';
import type { DeleteRoleResponseDto } from '~/modules/role/delete-role.response.dto';

export class DeleteRoleCommand extends Command<DeleteRoleResponseDto> {
  constructor(public readonly input: DeleteRoleRequestDto) { super(); }
}
