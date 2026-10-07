import { Query } from '@nestjs/cqrs';

import { GetAgreementsRequestDto } from '#/modules/terms/dto/get-agreements.request.dto';
import { GetAgreementsResponseDto } from '#/modules/terms/dto/get-agreements.response.dto';

export interface GetAgreementsPayload {
  query: GetAgreementsRequestDto
}

export class GetAgreementsQuery extends Query<GetAgreementsResponseDto> {
  constructor(public readonly input: GetAgreementsPayload) { super(); }
}
