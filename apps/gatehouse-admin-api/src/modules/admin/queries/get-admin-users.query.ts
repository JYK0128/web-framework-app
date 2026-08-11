import { Query } from '@nestjs/cqrs';

import { AdminUsersQueryDto, AdminUsersResponseDto } from '#/modules/admin/admin.dto';

export class GetAdminUsersQuery extends Query<AdminUsersResponseDto> {
  constructor(public readonly input: AdminUsersQueryDto) {
    super();
  }
}
