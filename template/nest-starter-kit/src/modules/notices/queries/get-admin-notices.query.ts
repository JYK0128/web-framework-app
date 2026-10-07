import { Query } from '@nestjs/cqrs';

import type { GetAdminNoticesRequestDto, GetAdminNoticesResponseDto } from '#/modules/notices/dto';

export interface GetAdminNoticesPayload {
  query: GetAdminNoticesRequestDto
}

export class GetAdminNoticesQuery extends Query<GetAdminNoticesResponseDto> {
  constructor(public readonly input: GetAdminNoticesPayload) {
    super();
  }
}
