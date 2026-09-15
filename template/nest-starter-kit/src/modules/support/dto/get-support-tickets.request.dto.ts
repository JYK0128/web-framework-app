import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { PageRequestDto, SortDirection } from '#/common/interfaces';
import { SupportTicket, SupportTicketPriority, SupportTicketStatus } from '#/entities/support/support-ticket.entity';

export const SUPPORT_TICKET_SORT = ['category', 'title', 'status', 'priority', 'createdAt', 'updatedAt', 'id'] as const;
export type SupportTicketSortKey = (typeof SUPPORT_TICKET_SORT)[number];

export class GetSupportTicketsRequestDto extends PageRequestDto<SupportTicket, SupportTicketSortKey> {
  override get searchFields(): (keyof SupportTicket)[] {
    return ['category', 'title', 'content'];
  }

  @ApiEnumOptional({ enum: SupportTicketStatus })
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @ApiEnumOptional({ enum: SupportTicketPriority })
  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ isArray: true, enum: SUPPORT_TICKET_SORT })
  @IsOptional()
  @IsIn(SUPPORT_TICKET_SORT, { each: true })
  override sort: SupportTicketSortKey[] = ['createdAt'];

  @ApiEnumOptional({ isArray: true, enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection, { each: true })
  override direction: SortDirection[] = [SortDirection.DESC];

  override toFilterQuery(): ObjectQuery<SupportTicket> {
    const filters: ObjectQuery<SupportTicket> = {};
    if (this.status) filters.status = this.status;
    if (this.priority) filters.priority = this.priority;
    if (this.category) filters.category = this.category;

    const searchQuery = this.toSearchQuery();
    return searchQuery ? { $and: [filters, searchQuery] } : filters;
  }
}
