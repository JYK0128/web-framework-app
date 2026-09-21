import { Command } from '@nestjs/cqrs';

import type { CreateRoleRequestDto, CreateRoleResponseDto } from '#/modules/roles/interfaces';

export class CreateRoleCommand extends Command<CreateRoleResponseDto> {
  constructor(public readonly input: CreateRoleRequestDto) { super(); }
}
