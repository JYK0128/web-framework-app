import { Query } from '@nestjs/cqrs';

import { GetTermsRequestDto } from '#/modules/terms/dto/get-terms.request.dto';
import { GetTermsResponseDto } from '#/modules/terms/dto/get-terms.response.dto';

export interface GetTermsPayload {
  query: GetTermsRequestDto
}

export class GetTermsQuery extends Query<GetTermsResponseDto> {
  constructor(public readonly input: GetTermsPayload) { super(); }
}
