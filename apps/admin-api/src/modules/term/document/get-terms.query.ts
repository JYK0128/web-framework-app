import { Query } from '@nestjs/cqrs';

import type { GetTermsRequestDto } from '~/modules/term/document/get-terms.request.dto';
import type { GetTermsResponseDto } from '~/modules/term/document/get-terms.response.dto';

export class GetTermsQuery extends Query<GetTermsResponseDto> {
  constructor(public readonly input: GetTermsRequestDto) {
    super();
  }
}
