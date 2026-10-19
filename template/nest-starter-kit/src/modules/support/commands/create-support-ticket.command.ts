import { Command } from '@nestjs/cqrs';

import type { CreateSupportTicketRequestDto, CreateSupportTicketResponseDto } from '#/modules/support/dto';

export class CreateSupportTicketCommand extends Command<CreateSupportTicketResponseDto> {
  constructor(public readonly input: CreateSupportTicketRequestDto) {
    super();
  }
}
