import { Query } from '@nestjs/cqrs';

import type { GetOperatorsRequestDto, OperatorPageResponseDto } from '#/modules/operators/dto';

export class GetOperatorsQuery extends Query<OperatorPageResponseDto> {
  constructor(public readonly input: GetOperatorsRequestDto) {
    super();
  }
}
