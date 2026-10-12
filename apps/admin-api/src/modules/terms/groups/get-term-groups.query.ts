import { Query } from '@nestjs/cqrs';

import type { GetTermGroupsRequestDto } from '#/modules/terms/groups/get-term-groups.request.dto';
import type { GetTermGroupsResponseDto } from '#/modules/terms/groups/get-term-groups.response.dto';

export class GetTermGroupsQuery extends Query<GetTermGroupsResponseDto> {
  constructor(public readonly input: GetTermGroupsRequestDto) {
    super();
  }
}
