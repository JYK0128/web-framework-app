import type { FilterQuery } from '@mikro-orm/core';
import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Event, EventPhase } from '~/core/database/entities/events';
import { AppEntityManager } from '~/core/database/entity-manager';
import { GetEventSummaryQuery } from '~/modules/event/get-event-summary.query';
import { EventSummaryItemDto, GetEventSummaryResponseDto } from '~/modules/event/get-event-summary.response.dto';

const phaseByOrder: Record<number, EventPhase> = {
  0: EventPhase.ongoing,
  1: EventPhase.upcoming,
  2: EventPhase.ended,
};

@Injectable()
@QueryHandler(GetEventSummaryQuery)
export class GetEventSummaryHandler implements IQueryHandler<GetEventSummaryQuery, GetEventSummaryResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute({ input }: GetEventSummaryQuery): Promise<GetEventSummaryResponseDto> {
    const publicEvents: FilterQuery<Event> = { publishedAt: { $ne: null, $lte: new Date() } };
    const rows = await this.em.aggregate(Event, input.toAggregateOptions(publicEvents));
    const items = rows.map((row) => {
      const phaseOrder = row.phaseOrder;
      const phase = phaseOrder === undefined ? 'all' : phaseByOrder[Number(phaseOrder)];
      if (!phase) {
        throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: HttpStatus.INTERNAL_SERVER_ERROR });
      }
      return { phase, eventCount: row.eventCount };
    });
    return GetEventSummaryResponseDto.parse({ items: EventSummaryItemDto.parseArray(items) });
  }
}
