import { Query } from '@nestjs/cqrs';

import type { GetAdminFaqsRequestDto, GetAdminFaqsResponseDto } from '#/modules/faqs/dto';

export class GetAdminFaqsQuery extends Query<GetAdminFaqsResponseDto> {
  constructor(public readonly query: GetAdminFaqsRequestDto) {
    super();
  }
}
