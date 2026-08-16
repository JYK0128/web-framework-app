import { type IQuery } from '@nestjs/cqrs';

import { type GetActivityLogsRequestDto } from '#/modules/activity-logs/dto';

export class GetActivityLogsQuery implements IQuery {
  constructor(public readonly query: GetActivityLogsRequestDto) {}
}
