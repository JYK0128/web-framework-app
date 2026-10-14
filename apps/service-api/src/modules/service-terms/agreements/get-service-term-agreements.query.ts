import { Query } from '@nestjs/cqrs';

import { GetServiceTermAgreementsResponseDto } from '#/modules/service-terms/agreements/get-service-term-agreements.response.dto';

export class GetServiceTermAgreementsQuery extends Query<GetServiceTermAgreementsResponseDto> {
  constructor(public readonly input: { userId: string }) {
    super();
  }
}
