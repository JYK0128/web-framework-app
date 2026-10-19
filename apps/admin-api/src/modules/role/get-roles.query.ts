import { Query } from '@nestjs/cqrs';

import type { GetRolesRequestDto } from '#/modules/role/get-roles.request.dto';
import type { GetRolesResponseDto } from '#/modules/role/get-roles.response.dto';

export class GetRolesQuery extends Query<GetRolesResponseDto> {
  constructor(public readonly input: GetRolesRequestDto) { super(); }
}
