import { Query } from '@nestjs/cqrs';

import type { GetSupportTicketsRequestDto, GetSupportTicketsResponseDto } from '#/modules/support/dto';

export interface GetSupportTicketsPayload {
  query: GetSupportTicketsRequestDto
}

export class GetSupportTicketsQuery extends Query<GetSupportTicketsResponseDto> {
  constructor(public readonly input: GetSupportTicketsPayload) {
    super();
  }
}
