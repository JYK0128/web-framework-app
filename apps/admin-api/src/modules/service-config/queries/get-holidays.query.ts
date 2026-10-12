import { Query } from '@nestjs/cqrs';

import type { GetHolidaysRequestDto } from '#/modules/service-config/dto/get-holidays.request.dto';
import type { OperatingHolidayListResponseDto } from '#/modules/service-config/dto/operating-holiday-list.response.dto';

export interface GetHolidaysPayload {
  query: GetHolidaysRequestDto
}

export class GetHolidaysQuery extends Query<OperatingHolidayListResponseDto> {
  constructor(public readonly input: GetHolidaysPayload) {
    super();
  }
}
