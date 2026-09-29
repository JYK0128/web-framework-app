import { Query } from '@nestjs/cqrs';

import type { GetOperatorTermsRequestDto, GetOperatorTermsResponseDto } from '#/modules/terms/interfaces';

export class GetOperatorTermsQuery extends Query<GetOperatorTermsResponseDto> {
  constructor(public readonly input: GetOperatorTermsRequestDto) {
    super();
  }
}
