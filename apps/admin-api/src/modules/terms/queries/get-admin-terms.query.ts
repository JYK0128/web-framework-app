import { Query } from '@nestjs/cqrs';

import type { GetAdminTermsRequestDto, GetAdminTermsResponseDto } from '#/modules/terms/interfaces';

export class GetAdminTermsQuery extends Query<GetAdminTermsResponseDto> {
  constructor(public readonly input: GetAdminTermsRequestDto) {
    super();
  }
}
