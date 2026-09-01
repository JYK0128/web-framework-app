import { Query } from '@nestjs/cqrs';

import type { GetInquiryMessagesResponseDto } from '#/modules/inquiries/dto';

export interface GetInquiryMessagesPayload {
  inquiryId: string
  userId: string
  isAdmin: boolean
}

export class GetInquiryMessagesQuery extends Query<GetInquiryMessagesResponseDto> {
  constructor(public readonly input: GetInquiryMessagesPayload) {
    super();
  }
}
