import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SupportTicket } from '#/entities/support/support-ticket.entity';
import { AppEntityManager, type PageResult } from '#/infra/database/entity-manager';
import { GetAdminSupportTicketsResponseDto, SupportTicketItemDto } from '#/modules/support/dto';
import { GetAdminSupportTicketsQuery } from '#/modules/support/queries';

@Injectable()
@QueryHandler(GetAdminSupportTicketsQuery)
export class GetAdminSupportTicketsHandler implements IQueryHandler<GetAdminSupportTicketsQuery, GetAdminSupportTicketsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetAdminSupportTicketsQuery): Promise<GetAdminSupportTicketsResponseDto> {
    const pageResult = await this.identifyTickets(query.input.query);
    this.verify(pageResult);
    return this.process(pageResult);
  }

  private async identifyTickets(input: GetAdminSupportTicketsQuery['input']['query']): Promise<PageResult<SupportTicket>> {
    return this.em.findByPage(SupportTicket, input.toFilterQuery(), {
      ...input.toPageOptions(),
      populate: ['user', 'assignee'],
    });
  }

  private verify(pageResult: PageResult<SupportTicket>): void {
    if (!Array.isArray(pageResult.items)) {
      throw new Error('서포트 티켓 목록을 확인할 수 없습니다.');
    }
  }

  private process(pageResult: PageResult<SupportTicket>): GetAdminSupportTicketsResponseDto {
    return GetAdminSupportTicketsResponseDto.fromPlain({
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
