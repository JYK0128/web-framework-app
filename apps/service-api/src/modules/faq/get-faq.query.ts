import { Query } from '@nestjs/cqrs';

import type { GetFaqRequestDto } from '#/modules/faq/get-faq.request.dto';
import { GetFaqResponseDto } from '#/modules/faq/get-faq.response.dto';

export class GetFaqQuery extends Query<GetFaqResponseDto> {
  constructor(public readonly input: GetFaqRequestDto) {
    super();
  }
}
