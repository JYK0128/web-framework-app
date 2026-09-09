import { Query } from '@nestjs/cqrs';

import type { FindIdRequestDto } from '#/modules/auth/dto/find-id.request.dto';
import type { FindIdResponseDto } from '#/modules/auth/dto/find-id.response.dto';

export class FindIdQuery extends Query<FindIdResponseDto> {
  constructor(public readonly input: FindIdRequestDto) {
    super();
  }
}
