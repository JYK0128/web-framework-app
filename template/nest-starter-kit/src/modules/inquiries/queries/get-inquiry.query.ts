import { Query } from '@nestjs/cqrs';

import type { InquiryItemDto } from '#/modules/inquiries/dto';

export class GetInquiryQuery extends Query<InquiryItemDto> {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {
    super();
  }
}
