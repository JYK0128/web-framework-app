import { Query } from '@nestjs/cqrs';

import type { GetOperatorsRequestDto, GetOperatorsResponseDto } from '#/modules/operators/interfaces';

export class GetOperatorsQuery extends Query<GetOperatorsResponseDto> {
  constructor(public readonly input: GetOperatorsRequestDto) {
    super();
  }
}
