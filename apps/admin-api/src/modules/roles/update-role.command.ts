import { Command } from '@nestjs/cqrs';

import type { UpdateRoleRequestDto } from '#/modules/roles/update-role.request.dto';
import type { UpdateRoleResponseDto } from '#/modules/roles/update-role.response.dto';

export class UpdateRoleCommand extends Command<UpdateRoleResponseDto> {
  constructor(public readonly input: { roleId: string, input: UpdateRoleRequestDto }) { super(); }
}
