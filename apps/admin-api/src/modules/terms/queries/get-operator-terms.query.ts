import { Query } from '@nestjs/cqrs';

import type { GetOperatorTermsRequestDto, OperatorTermPageResponseDto } from '#/modules/terms/interfaces';

export class GetOperatorTermsQuery extends Query<OperatorTermPageResponseDto> {
  constructor(public readonly input: GetOperatorTermsRequestDto) {
    super();
  }
}
