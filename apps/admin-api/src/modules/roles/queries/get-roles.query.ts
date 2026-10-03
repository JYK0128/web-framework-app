import { Query } from '@nestjs/cqrs';

import type { GetRolesRequestDto, GetRolesResponseDto } from '#/modules/roles/interfaces';

export class GetRolesQuery extends Query<GetRolesResponseDto> {
  constructor(public readonly input: GetRolesRequestDto) { super(); }
}
