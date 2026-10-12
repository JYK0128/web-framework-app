import { Query } from '@nestjs/cqrs';

import type { GetTermsRequestDto } from '#/modules/terms/documents/get-terms.request.dto';
import type { GetTermsResponseDto } from '#/modules/terms/documents/get-terms.response.dto';

export class GetTermsQuery extends Query<GetTermsResponseDto> {
  constructor(public readonly input: GetTermsRequestDto) {
    super();
  }
}
