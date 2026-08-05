import { Query } from '@nestjs/cqrs';

import { GetPublishedTermsRequestDto } from '#/modules/terms/dto/get-published-terms.request.dto';
import { GetPublishedTermsResponseDto } from '#/modules/terms/dto/get-published-terms.response.dto';

export class GetPublishedTermsQuery extends Query<GetPublishedTermsResponseDto> {
  constructor(public readonly input: GetPublishedTermsRequestDto) { super(); }
}
