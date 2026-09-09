import { Command } from '@nestjs/cqrs';

import type { DeleteRoleResponseDto } from '#/modules/roles/dto';

export class DeleteRoleCommand extends Command<DeleteRoleResponseDto> {
  constructor(public readonly input: { id: string }) {
    super();
  }
}
