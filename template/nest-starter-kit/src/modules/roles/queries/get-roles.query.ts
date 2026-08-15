import { Query } from '@nestjs/cqrs';

import type { GetRolesResponseDto } from '#/modules/roles/dto';

export class GetRolesQuery extends Query<GetRolesResponseDto> {
  constructor() {
    super();
  }
}
