import { Query } from '@nestjs/cqrs';

import type { GetAdminNoticesRequestDto, GetAdminNoticesResponseDto } from '#/modules/notices/dto';

export class GetAdminNoticesQuery extends Query<GetAdminNoticesResponseDto> {
  constructor(public readonly query: GetAdminNoticesRequestDto) {
    super();
  }
}
