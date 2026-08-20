import { Query } from '@nestjs/cqrs';

import type { UserDetailDto } from '#/modules/users/dto';

export interface GetUserByIdPayload {
  id: string
}

export class GetUserByIdQuery extends Query<UserDetailDto> {
  constructor(public readonly input: GetUserByIdPayload) {
    super();
  }
}
