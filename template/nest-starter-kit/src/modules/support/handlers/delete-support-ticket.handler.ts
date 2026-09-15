import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { SupportTicket } from '#/entities/support/support-ticket.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DeleteSupportTicketCommand } from '#/modules/support/commands';
import { DeleteSupportTicketResponseDto } from '#/modules/support/dto';

@Injectable()
@CommandHandler(DeleteSupportTicketCommand)
export class DeleteSupportTicketHandler implements ICommandHandler<DeleteSupportTicketCommand, DeleteSupportTicketResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(command: DeleteSupportTicketCommand): Promise<DeleteSupportTicketResponseDto> {
    const ticket = await this.identifyTicket(command.input.ticketId);
    this.verify(ticket);
    ticket.deletedAt = new Date();
    ticket.deletedBy = this.sessionContext.requiredUser.id;
    return { ok: true };
  }

  private async identifyTicket(id: string): Promise<SupportTicket> {
    const ticket = await this.em.findOne(
      SupportTicket,
      { id, user: this.sessionContext.requiredUser.id },
      { filters: false },
    );
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
