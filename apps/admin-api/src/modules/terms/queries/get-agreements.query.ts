import { Query } from '@nestjs/cqrs';

import type { GetAgreementsRequestDto, GetAgreementsResponseDto } from '#/modules/terms/interfaces';

export class GetAgreementsQuery extends Query<GetAgreementsResponseDto> {
  constructor(public readonly input: GetAgreementsRequestDto) {
    super();
  }
}
