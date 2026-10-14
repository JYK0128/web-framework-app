import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Event } from '#/core/database/entities/events';
import { AppEntityManager } from '#/core/database/entity-manager';
import { EventItemDto } from '#/modules/events/event-item.dto';
import { GetEventsQuery } from '#/modules/events/get-events.query';
import { GetEventsResponseDto } from '#/modules/events/get-events.response.dto';

@Injectable()
@QueryHandler(GetEventsQuery)
export class GetEventsHandler implements IQueryHandler<GetEventsQuery, GetEventsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetEventsQuery): Promise<GetEventsResponseDto> {
    const result = await this.em.findByPage<Event>(Event, input.toFilterQuery(), input.toPageOptions());
    return GetEventsResponseDto.parse({ ...result, items: result.items.map((item) => EventItemDto.parseEntity(item)) });
  }
}
