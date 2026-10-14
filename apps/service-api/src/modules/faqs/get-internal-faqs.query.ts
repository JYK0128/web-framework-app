import { Query } from '@nestjs/cqrs';

import type { GetFaqsRequestDto } from '#/modules/faqs/get-faqs.request.dto';
import { GetFaqsResponseDto } from '#/modules/faqs/get-faqs.response.dto';

export class GetInternalFaqsQuery extends Query<GetFaqsResponseDto> {
  constructor(public readonly input: GetFaqsRequestDto) {
    super();
  }
}
