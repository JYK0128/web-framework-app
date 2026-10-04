import { Query } from '@nestjs/cqrs';

import type { GetRolesRequestDto, RoleListResponseDto } from '#/modules/roles/interfaces';

export class GetRolesQuery extends Query<RoleListResponseDto> {
  constructor(public readonly input: GetRolesRequestDto) { super(); }
}
