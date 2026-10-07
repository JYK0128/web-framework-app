import { Query } from '@nestjs/cqrs';

import type { GetSupportTicketResponseDto } from '#/modules/support/dto';

export interface GetSupportTicketPayload {
  ticketId: string
}

export class GetSupportTicketQuery extends Query<GetSupportTicketResponseDto> {
  constructor(public readonly input: GetSupportTicketPayload) {
    super();
  }
}
