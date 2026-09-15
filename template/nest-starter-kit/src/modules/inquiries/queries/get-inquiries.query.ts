import { Query } from '@nestjs/cqrs';

import type { GetInquiriesRequestDto, GetInquiriesResponseDto } from '#/modules/inquiries/dto';

export interface GetInquiriesPayload {
  query: GetInquiriesRequestDto
}

export class GetInquiriesQuery extends Query<GetInquiriesResponseDto> {
  constructor(public readonly input: GetInquiriesPayload) {
    super();
  }
}
