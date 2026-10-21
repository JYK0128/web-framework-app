import { Query } from '@nestjs/cqrs';

import type { MeRequestDto } from '~/modules/auth/profile/me.request.dto';
import type { MeResponseDto } from '~/modules/auth/profile/me.response.dto';

export interface MePayload {
  userId: string
  query?: MeRequestDto
}

export class MeQuery extends Query<MeResponseDto> {
  constructor(public readonly input: MePayload) {
    super();
  }
}
