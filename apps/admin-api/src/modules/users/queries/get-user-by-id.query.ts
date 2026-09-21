import { Query } from '@nestjs/cqrs';

import type { GetUserByIdResponseDto } from '#/modules/users/interfaces';

export class GetUserByIdQuery extends Query<GetUserByIdResponseDto> {
  constructor(public readonly userId: string) {
    super();
  }
}
