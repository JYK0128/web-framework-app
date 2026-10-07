import { Query } from '@nestjs/cqrs';

import type { GetHolidaysRequestDto } from '#/modules/system-configs/dto/get-holidays.request.dto';
import type { OperatingHolidayListResponseDto } from '#/modules/system-configs/dto/operating-holiday-list.response.dto';

export interface GetHolidaysPayload {
  query: GetHolidaysRequestDto
}

export class GetHolidaysQuery extends Query<OperatingHolidayListResponseDto> {
  constructor(public readonly input: GetHolidaysPayload) {
    super();
  }
}
