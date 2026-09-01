import { Query } from '@nestjs/cqrs';

import type { ActivityLogItemDto } from '#/modules/activity-logs/dto';

export interface GetActivityLogByIdPayload {
  id: string
}

export class GetActivityLogByIdQuery extends Query<ActivityLogItemDto> {
  constructor(public readonly input: GetActivityLogByIdPayload) {
    super();
  }
}
