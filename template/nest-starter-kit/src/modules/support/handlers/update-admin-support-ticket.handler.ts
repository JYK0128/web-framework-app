import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { User } from '#/entities/auth/user.entity';
import { SupportTicket } from '#/entities/support/support-ticket.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UpdateAdminSupportTicketCommand } from '#/modules/support/commands';
import { UpdateAdminSupportTicketRequestDto, UpdateAdminSupportTicketResponseDto } from '#/modules/support/dto';

@Injectable()
@CommandHandler(UpdateAdminSupportTicketCommand)
export class UpdateAdminSupportTicketHandler implements ICommandHandler<UpdateAdminSupportTicketCommand, UpdateAdminSupportTicketResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(command: UpdateAdminSupportTicketCommand): Promise<UpdateAdminSupportTicketResponseDto> {
    const ticket = await this.identifyTicket(command.input.ticketId);
    this.verify(ticket, command.input.input);
    const assignee = await this.identifyAssignee(command.input.input.assigneeId, ticket);
    return this.process(ticket, command.input.input, assignee);
  }

  private async identifyTicket(id: string): Promise<SupportTicket> {
    const ticket = await this.em.findOne(SupportTicket, { id }, { populate: ['user', 'assignee'] });
    if (!ticket || ticket.deletedAt) {
      throw new ApplicationError({ code: 'SUPPORT_TICKET_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return ticket;
  }

  private async identifyAssignee(assigneeId: string | null | undefined, ticket: SupportTicket): Promise<User | null> {
    if (assigneeId === null) return null;
    if (assigneeId) {
      const assignee = await this.em.findOne(User, { id: assigneeId, deletedAt: null });
      if (!assignee) {
        throw new ApplicationError({ code: 'SUPPORT_ASSIGNEE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
      }
      return assignee;
    }
    return ticket.assignee ?? this.em.findOne(User, { id: this.sessionContext.requiredUser.id, deletedAt: null });
  }

  private verify(ticket: SupportTicket, input: UpdateAdminSupportTicketRequestDto): void {
    if (!ticket) {
      throw new ApplicationError({ code: 'SUPPORT_TICKET_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    if ([input.category, input.title, input.content].some((value) => typeof value === 'string' && !value.trim())) {
      throw new ApplicationError({ code: 'SUPPORT_TICKET_CONTENT_REQUIRED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private process(
    ticket: SupportTicket,
    input: UpdateAdminSupportTicketRequestDto,
    assignee: User | null,
  ): UpdateAdminSupportTicketResponseDto {
    if (input.category !== undefined) ticket.category = input.category.trim();
    if (input.title !== undefined) ticket.title = input.title.trim();
    if (input.content !== undefined) ticket.content = input.content.trim();
    if (input.priority !== undefined) ticket.priority = input.priority;
    if (input.status !== undefined) ticket.status = input.status;
    if (input.resolution !== undefined) ticket.resolution = input.resolution?.trim() || null;
    if (assignee !== null) ticket.assignee = assignee;
    else if (input.assigneeId === null) ticket.assignee = null;

    return UpdateAdminSupportTicketResponseDto.fromPlain({
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
