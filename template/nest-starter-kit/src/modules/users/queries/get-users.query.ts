import { Query } from '@nestjs/cqrs';

import type { GetUsersRequestDto, GetUsersResponseDto } from '#/modules/users/dto';

export class GetUsersQuery extends Query<GetUsersResponseDto> {
  constructor(public readonly query: GetUsersRequestDto) {
    super();
  }
}
