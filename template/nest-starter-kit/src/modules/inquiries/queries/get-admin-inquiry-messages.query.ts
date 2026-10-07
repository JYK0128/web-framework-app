import { Query } from '@nestjs/cqrs';

import type { GetAdminInquiryMessagesResponseDto } from '#/modules/inquiries/dto';

export interface GetAdminInquiryMessagesPayload {
  inquiryId: string
}

export class GetAdminInquiryMessagesQuery extends Query<GetAdminInquiryMessagesResponseDto> {
  constructor(public readonly input: GetAdminInquiryMessagesPayload) {
    super();
  }
}
