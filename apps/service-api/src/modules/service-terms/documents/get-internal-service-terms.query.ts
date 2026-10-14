import { Query } from '@nestjs/cqrs';

import type { GetInternalServiceTermsRequestDto } from '#/modules/service-terms/documents/get-internal-service-terms.request.dto';
import { GetInternalServiceTermsResponseDto } from '#/modules/service-terms/documents/get-internal-service-terms.response.dto';

export class GetInternalServiceTermsQuery extends Query<GetInternalServiceTermsResponseDto> {
  constructor(public readonly input: GetInternalServiceTermsRequestDto) {
    super();
  }
}
