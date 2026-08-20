import { Query } from '@nestjs/cqrs';

import type { InquiryItemDto } from '#/modules/inquiries/dto';

export interface GetAdminInquiryPayload {
  id: string
}

export class GetAdminInquiryQuery extends Query<InquiryItemDto> {
  constructor(public readonly input: GetAdminInquiryPayload) {
    super();
  }
}
