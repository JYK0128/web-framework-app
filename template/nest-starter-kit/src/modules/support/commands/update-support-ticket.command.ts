import { Command } from '@nestjs/cqrs';

import type { UpdateSupportTicketRequestDto, UpdateSupportTicketResponseDto } from '#/modules/support/dto';

export interface UpdateSupportTicketPayload {
  ticketId: string
  input: UpdateSupportTicketRequestDto
}

export class UpdateSupportTicketCommand extends Command<UpdateSupportTicketResponseDto> {
  constructor(public readonly input: UpdateSupportTicketPayload) {
    super();
  }
}
