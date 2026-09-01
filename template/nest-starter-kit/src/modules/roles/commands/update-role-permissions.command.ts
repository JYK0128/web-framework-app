import { Command } from '@nestjs/cqrs';

import type { UpdateRolePermissionsRequestDto, UpdateRolePermissionsResponseDto } from '#/modules/roles/dto';

export interface UpdateRolePermissionsPayload {
  id: string
  input: UpdateRolePermissionsRequestDto
}

export class UpdateRolePermissionsCommand extends Command<UpdateRolePermissionsResponseDto> {
  constructor(public readonly input: UpdateRolePermissionsPayload) {
    super();
  }
}
