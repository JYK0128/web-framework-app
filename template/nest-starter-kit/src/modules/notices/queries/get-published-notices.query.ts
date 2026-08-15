import { Query } from '@nestjs/cqrs';

import type { GetNoticesResponseDto } from '#/modules/notices/dto';

export class GetPublishedNoticesQuery extends Query<GetNoticesResponseDto> {
  constructor(public readonly limit?: number) {
    super();
  }
}
