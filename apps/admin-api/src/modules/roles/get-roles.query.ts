import { Query } from '@nestjs/cqrs';

import type { GetRolesRequestDto } from '#/modules/roles/get-roles.request.dto';
import type { GetRolesResponseDto } from '#/modules/roles/get-roles.response.dto';

export class GetRolesQuery extends Query<GetRolesResponseDto> {
  constructor(public readonly input: GetRolesRequestDto) { super(); }
}
