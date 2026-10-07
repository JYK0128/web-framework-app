import { Query } from '@nestjs/cqrs';

import type { GetAdminSupportTicketResponseDto } from '#/modules/support/dto';

export interface GetAdminSupportTicketPayload {
  ticketId: string
}

export class GetAdminSupportTicketQuery extends Query<GetAdminSupportTicketResponseDto> {
  constructor(public readonly input: GetAdminSupportTicketPayload) {
    super();
  }
}
