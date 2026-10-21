import { Query } from '@nestjs/cqrs';

import type { GetServiceTermsRequestDto } from '~/modules/service-term/document/get-service-terms.request.dto';
import { GetServiceTermsResponseDto } from '~/modules/service-term/document/get-service-terms.response.dto';

export class GetServiceTermsQuery extends Query<GetServiceTermsResponseDto> {
  constructor(public readonly input: GetServiceTermsRequestDto) {
    super();
  }
}
