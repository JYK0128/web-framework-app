import { Query } from '@nestjs/cqrs';

import type { FindIdRequestDto } from '~/modules/auth/account/find-id.request.dto';
import type { FindIdResponseDto } from '~/modules/auth/account/find-id.response.dto';

export class FindIdQuery extends Query<FindIdResponseDto> {
  constructor(public readonly input: FindIdRequestDto) {
    super();
  }
}
