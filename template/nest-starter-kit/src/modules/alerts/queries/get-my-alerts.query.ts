import { Query } from '@nestjs/cqrs';

import type { AlertFeedResponseDto } from '#/modules/alerts/dto';

export interface GetMyAlertsPayload {
  userId: string
  limit?: number
}

export class GetMyAlertsQuery extends Query<AlertFeedResponseDto> {
  constructor(public readonly input: GetMyAlertsPayload) {
    super();
  }
}
