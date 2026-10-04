import { Command } from '@nestjs/cqrs';

import type { DeleteAdminSupportTicketResponseDto } from '#/modules/support/dto';

export interface DeleteAdminSupportTicketPayload {
  ticketId: string
}

export class DeleteAdminSupportTicketCommand extends Command<DeleteAdminSupportTicketResponseDto> {
  constructor(public readonly input: DeleteAdminSupportTicketPayload) {
    super();
  }
}
