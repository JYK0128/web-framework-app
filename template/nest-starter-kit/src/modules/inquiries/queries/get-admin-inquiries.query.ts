import { Query } from '@nestjs/cqrs';

import type { GetAdminInquiriesRequestDto, GetAdminInquiriesResponseDto } from '#/modules/inquiries/dto';

export class GetAdminInquiriesQuery extends Query<GetAdminInquiriesResponseDto> {
  constructor(public readonly query: GetAdminInquiriesRequestDto) {
    super();
  }
}
