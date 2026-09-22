import { Query } from '@nestjs/cqrs';

import { GetLogStatsRequestDto, type GetLogStatsResponseDto } from '#/modules/logs/dto';

export interface GetLogStatsPayload {
  query: GetLogStatsRequestDto
}

export class GetLogStatsQuery extends Query<GetLogStatsResponseDto> {
  constructor(public readonly input: GetLogStatsPayload = { query: new GetLogStatsRequestDto() }) {
    super();
  }
}
