import { Query } from '@nestjs/cqrs';

import type { GetUserTermsRequestDto, GetUserTermsResponseDto } from '#/modules/terms/interfaces';

export class GetUserTermsQuery extends Query<GetUserTermsResponseDto> {
  constructor(public readonly input: GetUserTermsRequestDto) {
    super();
  }
}
