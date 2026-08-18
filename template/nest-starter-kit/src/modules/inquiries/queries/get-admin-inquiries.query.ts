import { Query } from '@nestjs/cqrs';

import type { GetAdminInquiriesRequestDto, GetInquiriesResponseDto } from '#/modules/inquiries/dto';

export class GetAdminInquiriesQuery extends Query<GetInquiriesResponseDto> {
  constructor(public readonly query: GetAdminInquiriesRequestDto) {
    super();
  }
}
