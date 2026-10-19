import { Command } from '@nestjs/cqrs';

import type { UpdateRoleRequestDto, UpdateRoleResponseDto } from '#/modules/roles/interfaces';

export class UpdateRoleCommand extends Command<UpdateRoleResponseDto> {
  constructor(public readonly input: { roleId: string, input: UpdateRoleRequestDto }) { super(); }
}
