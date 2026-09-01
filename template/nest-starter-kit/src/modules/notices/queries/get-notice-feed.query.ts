import { Query } from '@nestjs/cqrs';

import type { GetNoticeFeedRequestDto, GetNoticeFeedResponseDto } from '#/modules/notices/dto';

export interface GetNoticeFeedPayload {
  query: GetNoticeFeedRequestDto
  userId?: string
}

export class GetNoticeFeedQuery extends Query<GetNoticeFeedResponseDto> {
  constructor(public readonly input: GetNoticeFeedPayload) {
    super();
  }
}
