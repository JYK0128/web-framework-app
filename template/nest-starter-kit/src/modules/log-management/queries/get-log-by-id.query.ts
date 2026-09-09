import { Query } from '@nestjs/cqrs';

import type { GetLogResponseDto } from '#/modules/log-management/dto';

export interface GetLogByIdPayload {
  id: string
}

export class GetLogByIdQuery extends Query<GetLogResponseDto> {
  constructor(public readonly input: GetLogByIdPayload) {
    super();
  }
}
