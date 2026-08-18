import { Query } from '@nestjs/cqrs';

import type { GetInquiryMessagesResponseDto } from '#/modules/inquiries/dto';

export class GetInquiryMessagesQuery extends Query<GetInquiryMessagesResponseDto> {
  constructor(
    public readonly inquiryId: string,
    public readonly userId: string,
    public readonly isAdmin: boolean,
  ) {
    super();
  }
}
