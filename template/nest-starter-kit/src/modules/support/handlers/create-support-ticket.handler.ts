import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { User } from '#/entities/auth/user.entity';
import { SupportTicket, SupportTicketPriority } from '#/entities/support/support-ticket.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CreateSupportTicketCommand } from '#/modules/support/commands';
import { CreateSupportTicketRequestDto, CreateSupportTicketResponseDto } from '#/modules/support/dto';

@Injectable()
@CommandHandler(CreateSupportTicketCommand)
export class CreateSupportTicketHandler implements ICommandHandler<CreateSupportTicketCommand, CreateSupportTicketResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(command: CreateSupportTicketCommand): Promise<CreateSupportTicketResponseDto> {
    const user = await this.identifyUser(this.sessionContext.requiredUser.id);
    const input = this.identify(command.input);
    this.verify(user, input);
    return this.process(input, user);
  }

  private identify(input: CreateSupportTicketRequestDto): CreateSupportTicketRequestDto {
    return {
      ...input,
      category: input.category.trim(),
      title: input.title.trim(),
      content: input.content.trim(),
    };
  }

  private verify(user: User, input: CreateSupportTicketRequestDto): void {
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    if (!input.category || !input.title || !input.content) {
      throw new ApplicationError({ code: 'SUPPORT_TICKET_CONTENT_REQUIRED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async identifyUser(id: string): Promise<User> {
    return this.em.findOne(User, { id }) as Promise<User>;
  }

  private process(input: CreateSupportTicketRequestDto, user: User): CreateSupportTicketResponseDto {
    const ticket = this.em.create(SupportTicket, {
      user,
      category: input.category,
      title: input.title,
      content: input.content,
      priority: input.priority ?? SupportTicketPriority.NORMAL,
    });
    this.em.persist(ticket);

    return CreateSupportTicketResponseDto.fromPlain({
      id: ticket.id,
      userId: user.id,
      userName: user.name,
      assigneeId: null,
      assigneeName: null,
      category: ticket.category,
      title: ticket.title,
      content: ticket.content,
      priority: ticket.priority,
      status: ticket.status,
      resolution: null,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    });
  }
}
