import { Query } from '@nestjs/cqrs';

import type { GetOperatorByIdResponseDto } from '#/modules/operators/interfaces';

export class GetOperatorByIdQuery extends Query<GetOperatorByIdResponseDto> {
  constructor(public readonly operatorId: string) {
    super();
  }
}
