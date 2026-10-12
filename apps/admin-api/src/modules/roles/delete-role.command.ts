import { Command } from '@nestjs/cqrs';

import type { DeleteRoleResponseDto } from '#/modules/roles';

export class DeleteRoleCommand extends Command<DeleteRoleResponseDto> {
  constructor(public readonly input: { roleId: string }) { super(); }
}
