import { Query } from '@nestjs/cqrs';

import type { GetRolesRequestDto, RoleListResponseDto } from '#/modules/roles/dto';

export class GetRolesQuery extends Query<RoleListResponseDto> {
  constructor(public readonly input: GetRolesRequestDto) { super(); }
}
