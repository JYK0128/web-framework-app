import { Command } from '@nestjs/cqrs';

import type { DeleteSupportTicketResponseDto } from '#/modules/support/dto';

export interface DeleteSupportTicketPayload {
  ticketId: string
}

export class DeleteSupportTicketCommand extends Command<DeleteSupportTicketResponseDto> {
  constructor(public readonly input: DeleteSupportTicketPayload) {
    super();
  }
}
