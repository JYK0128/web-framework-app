import { Query } from '@nestjs/cqrs';

import type { GetOperatorsRequestDto } from '#/modules/operators/profile/get-operators.request.dto';
import type { GetOperatorsResponseDto } from '#/modules/operators/profile/get-operators.response.dto';

export class GetOperatorsQuery extends Query<GetOperatorsResponseDto> {
  constructor(public readonly input: GetOperatorsRequestDto) {
    super();
  }
}
