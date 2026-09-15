import { Query } from '@nestjs/cqrs';

import type { GetLogByIdResponseDto } from '#/modules/log-management/dto';

export interface GetLogByIdPayload {
  logId: string
}

export class GetLogByIdQuery extends Query<GetLogByIdResponseDto> {
  constructor(public readonly input: GetLogByIdPayload) {
    super();
  }
}
