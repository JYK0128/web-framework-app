import { Query } from '@nestjs/cqrs';

import { type GetLogsRequestDto, type GetLogsResponseDto } from '#/modules/logs/dto';

export interface GetLogsPayload {
  query: GetLogsRequestDto
}

export class GetLogsQuery extends Query<GetLogsResponseDto> {
  constructor(public readonly input: GetLogsPayload) {
    super();
  }
}
