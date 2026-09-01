import { Query } from '@nestjs/cqrs';

import { type GetActivityLogsRequestDto, type GetActivityLogsResponseDto } from '#/modules/activity-logs/dto';

export class GetActivityLogsQuery extends Query<GetActivityLogsResponseDto> {
  constructor(public readonly query: GetActivityLogsRequestDto) {
    super();
  }
}
