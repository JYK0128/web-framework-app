import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SessionContext } from '#/common/contexts/session.context';
import { SupportTicket } from '#/entities/support/support-ticket.entity';
import { AppEntityManager, type PageResult } from '#/infra/database/entity-manager';
import { GetSupportTicketsResponseDto, SupportTicketItemDto } from '#/modules/support/dto';
import { GetSupportTicketsQuery } from '#/modules/support/queries';

@Injectable()
@QueryHandler(GetSupportTicketsQuery)
export class GetSupportTicketsHandler implements IQueryHandler<GetSupportTicketsQuery, GetSupportTicketsResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(query: GetSupportTicketsQuery): Promise<GetSupportTicketsResponseDto> {
    const pageResult = await this.identifyTickets(query.input.query);
    this.verify(pageResult);
    return this.process(pageResult);
  }

  private verify(pageResult: PageResult<SupportTicket>): void {
    if (!Array.isArray(pageResult.items)) {
      throw new Error('서포트 티켓 목록을 확인할 수 없습니다.');
    }
  }

  private async identifyTickets(input: GetSupportTicketsQuery['input']['query']): Promise<PageResult<SupportTicket>> {
    return this.em.findByPage(
      SupportTicket,
      { $and: [{ user: this.sessionContext.requiredUser.id }, input.toFilterQuery()] },
      { ...input.toPageOptions(), populate: ['user', 'assignee'] },
    );
  }

  private process(pageResult: PageResult<SupportTicket>): GetSupportTicketsResponseDto {
    return GetSupportTicketsResponseDto.fromPlain({
      ...pageResult,
      items: pageResult.items.map((ticket) => SupportTicketItemDto.fromPlain({
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
      })),
    });
  }
}
