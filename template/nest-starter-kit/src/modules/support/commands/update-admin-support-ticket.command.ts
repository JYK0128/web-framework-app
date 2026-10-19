import { Command } from '@nestjs/cqrs';

import type { UpdateAdminSupportTicketRequestDto, UpdateAdminSupportTicketResponseDto } from '#/modules/support/dto';

export interface UpdateAdminSupportTicketPayload {
  ticketId: string
  input: UpdateAdminSupportTicketRequestDto
}

export class UpdateAdminSupportTicketCommand extends Command<UpdateAdminSupportTicketResponseDto> {
  constructor(public readonly input: UpdateAdminSupportTicketPayload) {
    super();
  }
}
