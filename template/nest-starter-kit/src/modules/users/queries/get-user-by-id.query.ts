import { Query } from '@nestjs/cqrs';

import type { GetUserByIdResponseDto } from '#/modules/users/dto';

export interface GetUserByIdPayload {
  id: string
}

export class GetUserByIdQuery extends Query<GetUserByIdResponseDto> {
  constructor(public readonly input: GetUserByIdPayload) {
    super();
  }
}
