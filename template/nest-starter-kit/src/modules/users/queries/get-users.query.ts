import { Query } from '@nestjs/cqrs';

import type { GetUsersRequestDto, GetUsersResponseDto } from '#/modules/users/dto';

export interface GetUsersPayload {
  query: GetUsersRequestDto
}

export class GetUsersQuery extends Query<GetUsersResponseDto> {
  constructor(public readonly input: GetUsersPayload) {
    super();
  }
}
