import { Command } from '@nestjs/cqrs';

import { AdminUpdateUserStatusRequestDto, AdminUserDto } from '#/modules/admin/admin.dto';

export class UpdateAdminUserStatusCommand extends Command<AdminUserDto> {
  constructor(
    public readonly id: string,
    public readonly input: AdminUpdateUserStatusRequestDto,
  ) {
    super();
  }
}
