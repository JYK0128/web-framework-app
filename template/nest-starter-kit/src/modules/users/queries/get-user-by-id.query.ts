import { Query } from '@nestjs/cqrs';

import type { UserDetailDto } from '#/modules/users/dto';

export class GetUserByIdQuery extends Query<UserDetailDto> {
  constructor(public readonly id: string) {
    super();
  }
}
