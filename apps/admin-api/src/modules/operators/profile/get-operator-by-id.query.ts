import { Query } from '@nestjs/cqrs';

import type { GetOperatorByIdRequestDto } from '#/modules/operators/profile/get-operator-by-id.request.dto';
import type { GetOperatorByIdResponseDto } from '#/modules/operators/profile/get-operator-by-id.response.dto';

export class GetOperatorByIdQuery extends Query<GetOperatorByIdResponseDto> {
  constructor(public readonly input: GetOperatorByIdRequestDto) {
    super();
  }
}
