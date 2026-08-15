import { Query } from '@nestjs/cqrs';

import type { GetFaqsRequestDto, GetFaqsResponseDto } from '#/modules/faqs/dto';

export class GetFaqsQuery extends Query<GetFaqsResponseDto> {
  constructor(public readonly query: GetFaqsRequestDto) {
    super();
  }
}
