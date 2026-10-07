import { Query } from '@nestjs/cqrs';

import type { GetAdminTermsRequestDto, GetAdminTermsResponseDto } from '#/modules/terms/dto';

export interface GetAdminTermsPayload {
  query: GetAdminTermsRequestDto
}

export class GetAdminTermsQuery extends Query<GetAdminTermsResponseDto> {
  constructor(public readonly input: GetAdminTermsPayload) {
    super();
  }
}
