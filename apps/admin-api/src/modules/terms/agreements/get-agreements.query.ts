import { Query } from '@nestjs/cqrs';

import type { GetAgreementsRequestDto, TermAgreementListResponseDto } from '#/modules/terms';

export class GetAgreementsQuery extends Query<TermAgreementListResponseDto> {
  constructor(public readonly input: GetAgreementsRequestDto) {
    super();
  }
}
