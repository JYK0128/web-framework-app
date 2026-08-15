import { Command } from '@nestjs/cqrs';

import type { UpdateRolePermissionsRequestDto, UpdateRolePermissionsResponseDto } from '#/modules/roles/dto';

export class UpdateRolePermissionsCommand extends Command<UpdateRolePermissionsResponseDto> {
  constructor(
    public readonly id: string,
    public readonly input: UpdateRolePermissionsRequestDto,
  ) {
    super();
  }
}
