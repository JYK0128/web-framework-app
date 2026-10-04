import { Query } from '@nestjs/cqrs';

import type { GetAdminFaqsRequestDto, GetAdminFaqsResponseDto } from '#/modules/faqs/dto';

export interface GetAdminFaqsPayload {
  query: GetAdminFaqsRequestDto
}

export class GetAdminFaqsQuery extends Query<GetAdminFaqsResponseDto> {
  constructor(public readonly input: GetAdminFaqsPayload) {
    super();
  }
}
