import { Query } from '@nestjs/cqrs';

import { GetMyAgreementsRequestDto } from '#/modules/terms/dto/get-my-agreements.request.dto';
import { GetMyAgreementsResponseDto } from '#/modules/terms/dto/get-my-agreements.response.dto';

export class GetMyAgreementsQuery extends Query<GetMyAgreementsResponseDto> {
  constructor(public readonly input: GetMyAgreementsRequestDto) { super(); }
}
