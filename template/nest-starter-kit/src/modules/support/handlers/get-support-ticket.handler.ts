import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { SupportTicket } from '#/entities/support/support-ticket.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetSupportTicketResponseDto } from '#/modules/support/dto';
import { GetSupportTicketQuery } from '#/modules/support/queries';

@Injectable()
@QueryHandler(GetSupportTicketQuery)
export class GetSupportTicketHandler implements IQueryHandler<GetSupportTicketQuery, GetSupportTicketResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(query: GetSupportTicketQuery): Promise<GetSupportTicketResponseDto> {
    const ticket = await this.identifyTicket(query.input.ticketId);
    this.verify(ticket);
    return this.process(ticket);
  }

  private async identifyTicket(id: string): Promise<SupportTicket> {
    const ticket = await this.em.findOne(
      SupportTicket,
      { id, user: this.sessionContext.requiredUser.id },
      { populate: ['user', 'assignee'] },
    );
    if (!ticket || ticket.deletedAt) {
      throw new ApplicationError({ code: 'SUPPORT_TICKET_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return ticket;
  }

  private verify(ticket: SupportTicket): void {
    if (!ticket) {
      throw new ApplicationError({ code: 'SUPPORT_TICKET_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
  }

  private process(ticket: SupportTicket): GetSupportTicketResponseDto {
    return GetSupportTicketResponseDto.fromPlain({
      id: ticket.id,
      userId: ticket.user.id,
      userName: ticket.user.name,
      assigneeId: ticket.assignee?.id ?? null,
      assigneeName: ticket.assignee?.name ?? null,
      category: ticket.category,
      title: ticket.title,
      content: ticket.content,
      priority: ticket.priority,
      status: ticket.status,
      resolution: ticket.resolution ?? null,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    });
  }
}
