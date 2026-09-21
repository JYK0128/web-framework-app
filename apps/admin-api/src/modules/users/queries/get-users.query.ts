import { Query } from '@nestjs/cqrs';

import type { GetUsersRequestDto, GetUsersResponseDto } from '#/modules/users/interfaces';

export class GetUsersQuery extends Query<GetUsersResponseDto> {
  constructor(public readonly input: GetUsersRequestDto) {
    super();
  }
}
