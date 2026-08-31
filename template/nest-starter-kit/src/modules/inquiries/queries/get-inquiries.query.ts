import { Query } from '@nestjs/cqrs';

import type { GetInquiriesRequestDto, GetInquiriesResponseDto } from '#/modules/inquiries/dto';

export class GetInquiriesQuery extends Query<GetInquiriesResponseDto> {
  constructor(
    public readonly query: GetInquiriesRequestDto,
    public readonly userId: string,
  ) {
    super();
  }
}
