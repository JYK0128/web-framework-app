import { Query } from '@nestjs/cqrs';

import type { MeRequestDto, MeResponseDto } from '#/modules/auth/interfaces';

export interface MePayload {
  userId: string
  query?: MeRequestDto
}

export class MeQuery extends Query<MeResponseDto> {
  constructor(public readonly input: MePayload) {
    super();
  }
}
