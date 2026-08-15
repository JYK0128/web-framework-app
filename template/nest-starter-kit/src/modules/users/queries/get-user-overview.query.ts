import { Query } from '@nestjs/cqrs';

import type { UserOverviewDto } from '#/modules/users/dto';

export class GetUserOverviewQuery extends Query<UserOverviewDto> {
  constructor() {
    super();
  }
}
