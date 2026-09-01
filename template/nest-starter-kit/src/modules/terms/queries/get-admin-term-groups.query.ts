import { Query } from '@nestjs/cqrs';

import type { GetAdminTermGroupsResponseDto } from '#/modules/terms/dto';

export class GetAdminTermGroupsQuery extends Query<GetAdminTermGroupsResponseDto> {
  constructor() {
    super();
  }
}
