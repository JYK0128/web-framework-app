import { Query } from '@nestjs/cqrs';

import type { GetAdminNoticeResponseDto } from '#/modules/notices/dto';

export interface GetAdminNoticePayload {
  id: string
}

export class GetAdminNoticeQuery extends Query<GetAdminNoticeResponseDto> {
  constructor(public readonly input: GetAdminNoticePayload) {
    super();
  }
}
