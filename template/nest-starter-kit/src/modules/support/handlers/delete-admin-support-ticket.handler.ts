import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SupportTicket } from '#/entities/support/support-ticket.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DeleteAdminSupportTicketCommand } from '#/modules/support/commands';
import { DeleteAdminSupportTicketResponseDto } from '#/modules/support/dto';

@Injectable()
@CommandHandler(DeleteAdminSupportTicketCommand)
export class DeleteAdminSupportTicketHandler implements ICommandHandler<DeleteAdminSupportTicketCommand, DeleteAdminSupportTicketResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteAdminSupportTicketCommand): Promise<DeleteAdminSupportTicketResponseDto> {
    const ticket = await this.identifyTicket(command.input.ticketId);
    this.verify(ticket);
    ticket.deletedAt = new Date();
    return { ok: true };
  }

  private async identifyTicket(id: string): Promise<SupportTicket> {
    const ticket = await this.em.findOne(SupportTicket, { id }, { filters: false });
    if (!ticket || ticket.deletedAt) {
      throw new ApplicationError({ code: 'SUPPORT_TICKET_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return ticket;
  }

  private verify(ticket: SupportTicket): void {
    if (!ticket || ticket.deletedAt) {
      throw new ApplicationError({ code: 'SUPPORT_TICKET_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
  }
}
