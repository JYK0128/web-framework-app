import { Query } from '@nestjs/cqrs';

import type { GetFaqsRequestDto } from '~/modules/faq/get-faqs.request.dto';
import { GetFaqsResponseDto } from '~/modules/faq/get-faqs.response.dto';

export class GetInternalFaqsQuery extends Query<GetFaqsResponseDto> {
  constructor(public readonly input: GetFaqsRequestDto) {
    super();
  }
}
