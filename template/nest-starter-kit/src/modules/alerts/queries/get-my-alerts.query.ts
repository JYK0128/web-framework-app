import { Query } from '@nestjs/cqrs';

import type { AlertFeedResponseDto, GetAlertsRequestDto } from '#/modules/alerts/dto';

export class GetMyAlertsQuery extends Query<AlertFeedResponseDto> {
  constructor(public readonly input: GetAlertsRequestDto) {
    super();
  }
}
