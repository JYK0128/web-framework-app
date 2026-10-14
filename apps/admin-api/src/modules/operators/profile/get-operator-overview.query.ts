import { Query } from '@nestjs/cqrs';

import type { GetOperatorOverviewRequestDto } from '#/modules/operators/profile/get-operator-overview.request.dto';
import type { GetOperatorOverviewResponseDto } from '#/modules/operators/profile/get-operator-overview.response.dto';

export class GetOperatorOverviewQuery extends Query<GetOperatorOverviewResponseDto> {
  constructor(public readonly input: GetOperatorOverviewRequestDto) { super(); }
}
