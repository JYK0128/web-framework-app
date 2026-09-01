import { Query } from '@nestjs/cqrs';

import type { GetAdminInquiryResponseDto } from '#/modules/inquiries/dto';

export interface GetAdminInquiryPayload {
  id: string
}

export class GetAdminInquiryQuery extends Query<GetAdminInquiryResponseDto> {
  constructor(public readonly input: GetAdminInquiryPayload) {
    super();
  }
}
