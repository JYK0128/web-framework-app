import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { SupportTicket } from '#/entities/support/support-ticket.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UpdateSupportTicketCommand } from '#/modules/support/commands';
import { UpdateSupportTicketRequestDto, UpdateSupportTicketResponseDto } from '#/modules/support/dto';

@Injectable()
@CommandHandler(UpdateSupportTicketCommand)
export class UpdateSupportTicketHandler implements ICommandHandler<UpdateSupportTicketCommand, UpdateSupportTicketResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(command: UpdateSupportTicketCommand): Promise<UpdateSupportTicketResponseDto> {
    const ticket = await this.identifyTicket(command);
    this.verify(ticket, command.input.input);
    return this.process(ticket, command.input.input);
  }

  private async identifyTicket(command: UpdateSupportTicketCommand): Promise<SupportTicket> {
    const ticket = await this.em.findOne(
      SupportTicket,
      { id: command.input.ticketId, user: this.sessionContext.requiredUser.id },
      { populate: ['user', 'assignee'] },
    );
    if (!ticket || ticket.deletedAt) {
      throw new ApplicationError({ code: 'SUPPORT_TICKET_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return ticket;
  }

  private verify(ticket: SupportTicket, input: UpdateSupportTicketRequestDto): void {
    if (!ticket) {
      throw new ApplicationError({ code: 'SUPPORT_TICKET_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    if ([input.category, input.title, input.content].some((value) => typeof value === 'string' && !value.trim())) {
      throw new ApplicationError({ code: 'SUPPORT_TICKET_CONTENT_REQUIRED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private process(ticket: SupportTicket, input: UpdateSupportTicketRequestDto): UpdateSupportTicketResponseDto {
    if (input.status !== undefined) ticket.status = input.status;

    const plain = {
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
    };
    return UpdateSupportTicketResponseDto.fromPlain(plain);
  }
}
