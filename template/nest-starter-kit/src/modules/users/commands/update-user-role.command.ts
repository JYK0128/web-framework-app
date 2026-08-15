import type { RoleName } from '#/entities/auth.extentions/role.entity';

export class UpdateUserRoleCommand {
  constructor(
    public readonly id: string,
    public readonly role: RoleName,
    public readonly currentUserId: string,
  ) {}
}
