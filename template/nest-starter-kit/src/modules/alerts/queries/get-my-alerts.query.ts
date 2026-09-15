import { Query } from '@nestjs/cqrs';

import type { GetMyAlertsRequestDto, GetMyAlertsResponseDto } from '#/modules/alerts/dto';

export interface GetMyAlertsPayload {
  query: GetMyAlertsRequestDto
}

export class GetMyAlertsQuery extends Query<GetMyAlertsResponseDto> {
  constructor(public readonly input: GetMyAlertsPayload) {
    super();
  }
}
