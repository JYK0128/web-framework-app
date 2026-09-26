import { Query } from '@nestjs/cqrs';

import type { GetHolidaysRequestDto } from '#/modules/system-configs/dto/get-holidays.request.dto';
import type { GetHolidaysResponseDto } from '#/modules/system-configs/dto/get-holidays.response.dto';

export interface GetHolidaysPayload {
  query: GetHolidaysRequestDto
}

export class GetHolidaysQuery extends Query<GetHolidaysResponseDto> {
  constructor(public readonly input: GetHolidaysPayload) {
    super();
  }
}
