import { Query } from '@nestjs/cqrs';

import type { GetAdminSupportTicketsRequestDto, GetAdminSupportTicketsResponseDto } from '#/modules/support/dto';

export interface GetAdminSupportTicketsPayload {
  query: GetAdminSupportTicketsRequestDto
}

export class GetAdminSupportTicketsQuery extends Query<GetAdminSupportTicketsResponseDto> {
  constructor(public readonly input: GetAdminSupportTicketsPayload) {
    super();
  }
}
