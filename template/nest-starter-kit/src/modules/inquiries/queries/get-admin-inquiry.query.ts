import { Query } from '@nestjs/cqrs';

import type { InquiryItemDto } from '#/modules/inquiries/dto';

export class GetAdminInquiryQuery extends Query<InquiryItemDto> {
  constructor(public readonly id: string) {
    super();
  }
}
