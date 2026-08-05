import { Query } from '@nestjs/cqrs';

import { TermsValidateAgreementsRequestDto } from '#/modules/auth/dto/terms-validate-agreements.request.dto';
import type { TermsValidateAgreementsResponseDto } from '#/modules/auth/dto/terms-validate-agreements.response.dto';

export class TermsValidateAgreementsQuery extends Query<TermsValidateAgreementsResponseDto> {
  constructor(public readonly input: TermsValidateAgreementsRequestDto) { super(); }
}
