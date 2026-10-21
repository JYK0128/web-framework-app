import { Command } from '@nestjs/cqrs';

import type { CreateRoleRequestDto } from '~/modules/role/create-role.request.dto';
import type { CreateRoleResponseDto } from '~/modules/role/create-role.response.dto';

export class CreateRoleCommand extends Command<CreateRoleResponseDto> {
  constructor(public readonly input: CreateRoleRequestDto) { super(); }
}
