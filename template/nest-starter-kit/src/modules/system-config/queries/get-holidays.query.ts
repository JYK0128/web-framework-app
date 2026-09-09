import { Query } from '@nestjs/cqrs';

import type { GetHolidaysRequestDto, GetHolidaysResponseDto } from '#/modules/system-config/dto';

export class GetHolidaysQuery extends Query<GetHolidaysResponseDto> {
  constructor(public readonly input?: GetHolidaysRequestDto) {
    super();
  }
}
