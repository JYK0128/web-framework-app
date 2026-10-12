import { Query } from '@nestjs/cqrs';

import type { GetOperatorsRequestDto, OperatorPageResponseDto } from '#/modules/operators';

export class GetOperatorsQuery extends Query<OperatorPageResponseDto> {
  constructor(public readonly input: GetOperatorsRequestDto) {
    super();
  }
}
