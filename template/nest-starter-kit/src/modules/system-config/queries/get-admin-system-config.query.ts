import { Query } from '@nestjs/cqrs';

import type { GetAdminSystemConfigRequestDto, GetAdminSystemConfigResponseDto } from '#/modules/system-config/dto';

export interface GetAdminSystemConfigPayload {
  query?: GetAdminSystemConfigRequestDto
}

export class GetAdminSystemConfigQuery extends Query<GetAdminSystemConfigResponseDto> {
  constructor(public readonly input: GetAdminSystemConfigPayload = {}) {
    super();
  }
}
