import type { UpdateRolePermissionsRequestDto } from '#/modules/roles/dto';

export class UpdateRolePermissionsCommand {
  constructor(
    public readonly id: string,
    public readonly input: UpdateRolePermissionsRequestDto,
  ) {}
}
