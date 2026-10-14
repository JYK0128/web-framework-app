import { Query } from '@nestjs/cqrs';

import type { GetPublicFaqsRequestDto } from '#/modules/faqs/get-public-faqs.request.dto';
import { GetPublicFaqsResponseDto } from '#/modules/faqs/get-public-faqs.response.dto';

export class GetFaqsQuery extends Query<GetPublicFaqsResponseDto> {
  constructor(public readonly input: GetPublicFaqsRequestDto) {
    super();
  }
}
