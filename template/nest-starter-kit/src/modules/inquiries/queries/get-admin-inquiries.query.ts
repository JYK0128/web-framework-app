import { Query } from '@nestjs/cqrs';

import type { GetAdminInquiriesRequestDto, GetAdminInquiriesResponseDto } from '#/modules/inquiries/dto';

export interface GetAdminInquiriesPayload {
  query: GetAdminInquiriesRequestDto
}

export class GetAdminInquiriesQuery extends Query<GetAdminInquiriesResponseDto> {
  constructor(public readonly input: GetAdminInquiriesPayload) {
    super();
  }
}
