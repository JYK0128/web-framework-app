import { Query } from '@nestjs/cqrs';

import type { GetInquiryResponseDto } from '#/modules/inquiries/dto';

export interface GetInquiryPayload {
  id: string
  userId: string
}

export class GetInquiryQuery extends Query<GetInquiryResponseDto> {
  constructor(public readonly input: GetInquiryPayload) {
    super();
  }
}
