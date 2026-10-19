import { Query } from '@nestjs/cqrs';

import type { GetAgreementsRequestDto } from '#/modules/term/agreement/get-agreements.request.dto';
import type { GetAgreementsResponseDto } from '#/modules/term/agreement/get-agreements.response.dto';

export class GetAgreementsQuery extends Query<GetAgreementsResponseDto> {
  constructor(public readonly input: GetAgreementsRequestDto) {
    super();
  }
}
