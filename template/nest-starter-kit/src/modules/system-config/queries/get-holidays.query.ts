import { Query } from '@nestjs/cqrs';

import { GetHolidaysRequestDto, type GetHolidaysResponseDto } from '#/modules/system-config/dto';

export interface GetHolidaysPayload {
  query: GetHolidaysRequestDto
}

export class GetHolidaysQuery extends Query<GetHolidaysResponseDto> {
  constructor(public readonly input: GetHolidaysPayload = { query: new GetHolidaysRequestDto() }) {
    super();
  }
}
