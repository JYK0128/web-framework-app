import type { GetUsersRequestDto } from '#/modules/users/dto';

export class GetUsersQuery {
  constructor(public readonly query: GetUsersRequestDto) {}
}
