import { Command } from '@nestjs/cqrs';

import type { CreateRoleRequestDto } from '#/modules/roles/create-role.request.dto';
import type { CreateRoleResponseDto } from '#/modules/roles/create-role.response.dto';

export class CreateRoleCommand extends Command<CreateRoleResponseDto> {
  constructor(public readonly input: CreateRoleRequestDto) { super(); }
}
