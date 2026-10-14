import { Query } from '@nestjs/cqrs';

import type { GetInternalServiceTermGroupsRequestDto } from '#/modules/service-terms/groups/get-internal-service-term-groups.request.dto';
import { GetInternalServiceTermGroupsResponseDto } from '#/modules/service-terms/groups/get-internal-service-term-groups.response.dto';

export class GetInternalServiceTermGroupsQuery extends Query<GetInternalServiceTermGroupsResponseDto> {
  constructor(public readonly input: GetInternalServiceTermGroupsRequestDto) {
    super();
  }
}
