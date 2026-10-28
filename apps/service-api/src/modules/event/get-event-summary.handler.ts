import type { FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { Event } from '~/core/database/entities/events';
import { GetEventSummaryQuery } from '~/modules/event/get-event-summary.query';
import { EventSummaryItemDto, GetEventSummaryResponseDto } from '~/modules/event/get-event-summary.response.dto';

@Injectable()
@QueryHandler(GetEventSummaryQuery)
export class GetEventSummaryHandler implements IQueryHandler<GetEventSummaryQuery, GetEventSummaryResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute({ request, aggregation }: GetEventSummaryQuery): Promise<GetEventSummaryResponseDto> {
    const publicEvents: FilterQuery<Event> = { publishedAt: { $ne: null, $lte: new Date() } };
    const requestFilters = request.toQuery().where;
    const where: FilterQuery<Event> = Object.keys(requestFilters).length
      ? { $and: [requestFilters, publicEvents] }
      : publicEvents;
    const rows = await this.em.aggregate(Event, { ...aggregation.toQuery(), where });
    if (!aggregation.groupBy.length && rows.length !== 1) throw new TypeError('Expected one overall aggregate row');

    const items = rows.map((row) => aggregation.groupBy.includes('phase') ? row : { ...row, phase: 'all' });
    return GetEventSummaryResponseDto.parse({ items: EventSummaryItemDto.parseArray(items) });
  }
}
