import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { Event } from '~/core/database/entities/events';
import { EventItemDto } from '~/modules/event/event-item.dto';
import { GetEventsQuery } from '~/modules/event/get-events.query';
import { GetEventsResponseDto } from '~/modules/event/get-events.response.dto';

@Injectable()
@QueryHandler(GetEventsQuery)
export class GetEventsHandler implements IQueryHandler<GetEventsQuery, GetEventsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetEventsQuery): Promise<GetEventsResponseDto> {
    const { where, ...options } = input.toQuery();
    const result = await this.em.findByPage<Event>(Event, where, options);
    return GetEventsResponseDto.parse({ ...result, items: result.items.map((item) => EventItemDto.parseEntity(item)) });
  }
}
