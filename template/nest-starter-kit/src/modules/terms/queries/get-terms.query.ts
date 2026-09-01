import { Query } from '@nestjs/cqrs';

import { GetTermsRequestDto } from '#/modules/terms/dto/get-terms.request.dto';
import { GetTermsResponseDto } from '#/modules/terms/dto/get-terms.response.dto';

export class GetTermsQuery extends Query<GetTermsResponseDto> {
  constructor(public readonly input: GetTermsRequestDto) { super(); }
}
