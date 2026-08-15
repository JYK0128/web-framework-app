import { Query } from '@nestjs/cqrs';

import type { GetAdminTermsRequestDto, GetAdminTermsResponseDto } from '#/modules/terms/dto';

export class GetAdminTermsQuery extends Query<GetAdminTermsResponseDto> {
  constructor(public readonly query: GetAdminTermsRequestDto) {
    super();
  }
}
