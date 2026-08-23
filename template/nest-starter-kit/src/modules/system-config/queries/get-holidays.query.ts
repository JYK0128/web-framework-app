import { Query } from '@nestjs/cqrs';

import type { GetHolidaysRequestDto, GetHolidaysResponseDto } from '#/modules/system-config/dto';

export interface GetHolidaysPayload {
  query?: GetHolidaysRequestDto
}

export class GetHolidaysQuery extends Query<GetHolidaysResponseDto> {
  constructor(public readonly payload: GetHolidaysPayload = {}) {
    super();
  }
}
