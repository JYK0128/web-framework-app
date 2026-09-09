import { Command } from '@nestjs/cqrs';

import type { CreateRoleRequestDto, CreateRoleResponseDto } from '#/modules/roles/dto';

export class CreateRoleCommand extends Command<CreateRoleResponseDto> {
  constructor(public readonly input: CreateRoleRequestDto) {
    super();
  }
}
