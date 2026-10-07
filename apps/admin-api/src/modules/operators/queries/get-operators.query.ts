import { Query } from '@nestjs/cqrs';

import type { GetOperatorsRequestDto, OperatorPageResponseDto } from '#/modules/operators/interfaces';

export class GetOperatorsQuery extends Query<OperatorPageResponseDto> {
  constructor(public readonly input: GetOperatorsRequestDto) {
    super();
  }
}
