import { type FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { Event, EventPhase } from '~/core/database/entities/events';
import { EventItemDto } from '~/modules/event/event-item.dto';
import { GetPublicEventsQuery } from '~/modules/event/get-public-events.query';
import { GetPublicEventsResponseDto } from '~/modules/event/get-public-events.response.dto';

@Injectable()
@QueryHandler(GetPublicEventsQuery)
export class GetPublicEventsHandler implements IQueryHandler<GetPublicEventsQuery, GetPublicEventsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetPublicEventsQuery): Promise<GetPublicEventsResponseDto> {
    const { where, ...options } = input.toQuery();
    const filters: FilterQuery<Event>[] = [where, { publishedAt: { $ne: null, $lte: new Date() } }];
    const now = new Date();
    if (input.phase === EventPhase.ongoing) filters.push({ startsAt: { $lte: now }, endsAt: { $gt: now } });
    if (input.phase === EventPhase.upcoming) filters.push({ startsAt: { $gt: now } });
    if (input.phase === EventPhase.ended) filters.push({ endsAt: { $lte: now } });
    const result = await this.em.findByCursor(Event, {
      ...options,
      where: { $and: filters },
      orderBy: { startsAt: 'ASC', id: 'ASC' },
    });
    return GetPublicEventsResponseDto.parse({ ...result, startCursor: result.startCursor, endCursor: result.endCursor, items: result.items.map((item) => EventItemDto.parseEntity(item)) });
  }
}
