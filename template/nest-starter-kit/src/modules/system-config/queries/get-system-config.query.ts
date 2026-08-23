import { Query } from '@nestjs/cqrs';

import type { GetSystemConfigRequestDto, GetSystemConfigResponseDto } from '#/modules/system-config/dto';

export interface GetSystemConfigPayload {
  query?: GetSystemConfigRequestDto
}

export class GetSystemConfigQuery extends Query<GetSystemConfigResponseDto> {
  constructor(public readonly payload: GetSystemConfigPayload = {}) {
    super();
  }
}
