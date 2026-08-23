import { Query } from '@nestjs/cqrs';

import type { GetNoticesResponseDto } from '#/modules/notices/dto';

export interface GetPublishedNoticesPayload {
  limit?: number
}

export class GetPublishedNoticesQuery extends Query<GetNoticesResponseDto> {
  constructor(public readonly input: GetPublishedNoticesPayload = {}) {
    super();
  }
}
