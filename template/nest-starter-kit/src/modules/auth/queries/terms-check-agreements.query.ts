import { Query } from '@nestjs/cqrs';

import { TermsCheckAgreementsRequestDto } from '#/modules/auth/dto/terms-check-agreements.request.dto';
import type { TermsCheckAgreementsResponseDto } from '#/modules/auth/dto/terms-check-agreements.response.dto';

export class TermsCheckAgreementsQuery extends Query<TermsCheckAgreementsResponseDto> {
  constructor(public readonly input: TermsCheckAgreementsRequestDto) {
    super();
  }
}
