import { Query } from '@nestjs/cqrs';

import type { GetLogByIdResponseDto } from '#/modules/logs/dto';

export interface GetLogByIdPayload {
  logId: string
}

export class GetLogByIdQuery extends Query<GetLogByIdResponseDto> {
  constructor(public readonly input: GetLogByIdPayload) {
    super();
  }
}
