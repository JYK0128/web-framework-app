import { Query } from '@nestjs/cqrs';

import type { GetHolidaysRequestDto } from '#/modules/service-config/operation/get-holidays.request.dto';
import type { OperatingHolidayListResponseDto } from '#/modules/service-config/operation/operating-holiday-list.response.dto';

export interface GetHolidaysPayload {
  query: GetHolidaysRequestDto
}

export class GetHolidaysQuery extends Query<OperatingHolidayListResponseDto> {
  constructor(public readonly input: GetHolidaysPayload) {
    super();
  }
}
