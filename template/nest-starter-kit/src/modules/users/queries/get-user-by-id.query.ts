import { Query } from '@nestjs/cqrs';

import type { GetUserByIdResponseDto } from '#/modules/users/dto';

export interface GetUserByIdPayload {
  userId: string
}

export class GetUserByIdQuery extends Query<GetUserByIdResponseDto> {
  constructor(public readonly input: GetUserByIdPayload) {
    super();
  }
}
