import { Query } from '@nestjs/cqrs';

import type { LogItemDto } from '#/modules/log-management/dto';

export interface GetLogByIdPayload {
  id: string
}

export class GetLogByIdQuery extends Query<LogItemDto> {
  constructor(public readonly input: GetLogByIdPayload) {
    super();
  }
}
