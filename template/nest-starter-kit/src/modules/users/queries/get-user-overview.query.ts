import { Query } from '@nestjs/cqrs';

import type { GetUserOverviewResponseDto } from '#/modules/users/dto';

export class GetUserOverviewQuery extends Query<GetUserOverviewResponseDto> {
  constructor() {
    super();
  }
}
