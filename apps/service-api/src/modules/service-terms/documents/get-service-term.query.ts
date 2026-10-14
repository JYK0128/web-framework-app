import { Query } from '@nestjs/cqrs';

import type { GetServiceTermRequestDto } from '#/modules/service-terms/documents/get-service-term.request.dto';
import { GetServiceTermResponseDto } from '#/modules/service-terms/documents/get-service-term.response.dto';

export class GetServiceTermQuery extends Query<GetServiceTermResponseDto> {
  constructor(public readonly input: GetServiceTermRequestDto) {
    super();
  }
}
