import { Query } from '@nestjs/cqrs';

import type { GetFaqsRequestDto, GetFaqsResponseDto } from '#/modules/faqs/dto';

export interface GetFaqsPayload {
  query: GetFaqsRequestDto
}

export class GetFaqsQuery extends Query<GetFaqsResponseDto> {
  constructor(public readonly input: GetFaqsPayload) {
    super();
  }
}
